<script>
  import { onMount } from "svelte";
  
  export let userInfo;
  export let onVerifySuccess;
  
  let isVerifying = false;
  let isVerified = false;
  let verificationMessage = "";
  let profileOwnedByUser = false;
  let errorDetails = "";

  const browserAPI = (typeof globalThis !== 'undefined' && (globalThis.browser || globalThis.chrome)) || undefined;

  async function verifyAccount() {
    isVerifying = true;
    verificationMessage = "Verifying your profile...";
    errorDetails = "";
    profileOwnedByUser = false;
    
    try {
      // Check if user is on a social media page
      const tab = await new Promise((resolve) => {
        browserAPI.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          resolve(tab);
        });
      });

      const isInstagram = tab.url.includes('instagram.com');
      const isFacebook = tab.url.includes('facebook.com');
      const isX = tab.url.includes('twitter.com') || tab.url.includes('x.com');

      if (!isInstagram && !isFacebook && !isX) {
        verificationMessage = "Please navigate to Instagram, Facebook, or X profile";
        errorDetails = `Current URL: ${tab.url}`;
        isVerifying = false;
        return;
      }

      // Security: Reload the page to prevent verification bypass via script injection
      // This ensures we're checking the real page state, not a modified one
      verificationMessage = "Reloading page for security verification...";
      await new Promise((resolve) => {
        browserAPI.tabs.reload(tab.id, { bypassCache: true }, () => {
          if (browserAPI.runtime.lastError) {
            console.log('[CSC-Verify] Reload started');
          }
          resolve();
        });
      });

      // Wait for the page to fully reload and stabilize
      // We need to wait for the tab status to be "complete"
      await new Promise((resolve) => {
        let pageCompleteCount = 0; // Need to see status=complete multiple times
        const checkPageLoaded = () => {
          browserAPI.tabs.get(tab.id, (currentTab) => {
            if (currentTab.status === 'complete') {
              pageCompleteCount++;
              console.log('[CSC-Verify] Page complete (count: ' + pageCompleteCount + ')');
              // Instagram keeps loading content, wait for it to settle
              if (pageCompleteCount >= 2) {
                resolve();
              } else {
                setTimeout(checkPageLoaded, 500);
              }
            } else {
              // Page still loading, check again
              pageCompleteCount = 0;
              setTimeout(checkPageLoaded, 300);
            }
          });
        };
        
        // Start checking after a short delay to ensure reload has started
        setTimeout(checkPageLoaded, 500);
      });

      // Instagram does lazy loading - we need to wait longer for all content to appear
      // Increase wait time from 800ms to 2500ms to let dynamic content load
      verificationMessage = "Waiting for page content to load (this may take a few seconds)...";
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Now inject the content script on the fresh, fully loaded page
      try {
        await browserAPI.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js'],
        });
        console.log('[CSC-Verify] Content script injected successfully');
      } catch (e) {
        console.log('[CSC-Verify] Content script injection error:', e.message);
      }

      // Give the content script time to initialize
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // STEP 1: Request DOM check data from content script
      verificationMessage = "Scanning profile elements...";
      let domCheckData = null;

      try {
        domCheckData = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('DOM check timed out'));
          }, 3000);

          browserAPI.tabs.sendMessage(
            tab.id,
            { action: "getDOMCheckData" },
            (response) => {
              clearTimeout(timeout);
              if (browserAPI.runtime.lastError) {
                console.log('[CSC-Verify] Could not get DOM data:', browserAPI.runtime.lastError.message);
                resolve(null);
              } else if (response?.domCheckData) {
                console.log('[CSC-Verify] DOM data received:', response.domCheckData);
                resolve(response.domCheckData);
              } else {
                resolve(null);
              }
            }
          );
        });
      } catch (e) {
        console.log('[CSC-Verify] Error getting DOM data:', e.message);
        domCheckData = null;
      }

      // STEP 2: Send verification request to background service worker
      // Background script will perform multi-signal verification
      verificationMessage = "Verifying account ownership (multi-signal check)...";
      
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Verification request timed out. The page might not be fully loaded. Try refreshing and clicking Verify again.'));
        }, 10000);

        browserAPI.runtime.sendMessage(
          {
            action: 'verifyAccountOwnership',
            tabId: tab.id,
            tabUrl: tab.url,
            domCheckData: domCheckData
          },
          (response) => {
            clearTimeout(timeout);
            if (browserAPI.runtime.lastError) {
              console.error('[CSC-Verify] Runtime error:', browserAPI.runtime.lastError);
              reject(browserAPI.runtime.lastError);
            } else if (!response) {
              console.error('[CSC-Verify] No response received from background');
              reject(new Error('No response from background service worker.'));
            } else {
              console.log('[CSC-Verify] Background response:', response);
              resolve(response);
            }
          }
        );
      });

      // STEP 3: Process verification result
      if (response && response.isVerified) {
        profileOwnedByUser = true;
        isVerified = true;
        verificationMessage = "✓ Account verified! This is your profile.";
        console.log('[CSC-Verify] ✓ Profile verification successful via signals:', response.reason);
        console.log('[CSC-Verify] Signals used:', response.signals?.map(s => s.source).join(', '));
        setTimeout(() => {
          onVerifySuccess();
        }, 1500);
      } else {
        verificationMessage = "✗ Account verification failed";
        const reason = response?.reason || 'unknown';
        const collectedSignals = response?.collected || [];
        
        let detailMessage = "Could not verify ownership. ";
        
        if (reason === 'no_signals_available') {
          detailMessage += "No verification signals detected. Make sure you're logged in to Instagram.";
        } else if (reason === 'insufficient_signals') {
          detailMessage += `Only found these signals: ${collectedSignals.join(', ')}. At least 2 independent signals are required.`;
        } else if (reason === 'verification_error') {
          detailMessage += "Verification error: " + (response?.error || "Unknown error");
        } else {
          detailMessage += `Verification failed (${reason}). The page doesn't show your profile editing options or signals don't match.`;
        }
        
        errorDetails = detailMessage;
        console.log('[CSC-Verify] ✗ Profile verification failed. Reason:', reason, 'Signals:', collectedSignals);
        profileOwnedByUser = false;
      }
    } catch (error) {
      verificationMessage = "Unable to verify profile";
      const errorMsg = error?.message || "";
      
      if (errorMsg.includes('Receiving end does not exist')) {
        errorDetails = "The page content script is not responding. Try: 1) Refresh the page (F5), 2) Wait 2 seconds, 3) Click Verify again.";
      } else if (errorMsg.includes('timed out')) {
        errorDetails = "Verification took too long. The page might be loading. Refresh the page and try again.";
      } else if (errorMsg.includes('No response')) {
        errorDetails = "Content script not loaded. Refresh the page (F5) and click Verify again.";
      } else {
        errorDetails = errorMsg || "Make sure the page is fully loaded and try again. If the problem persists, refresh the page.";
      }
      
      console.error("[CSC-Verify] Verification error:", error);
    }

    isVerifying = false;
  }

  onMount(() => {
    // Optionally auto-check on mount
    // verifyAccount();
  });

</script>

<div class="w-full max-w-md mx-auto min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-3">
  <div class="bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
    <div class="bg-gradient-to-r from-emerald-400 to-cyan-400 p-5 text-slate-900 shadow-md">
      <h1 class="font-extrabold text-xl tracking-tight text-center">🔐 Verify Your Account</h1>
    </div>
    
    <div class="p-6 space-y-6">
      <div class="bg-slate-700/40 border border-slate-600 rounded-xl p-4">
        <p class="text-sm text-slate-300 mb-2">
          Welcome, <span class="font-semibold text-emerald-400">{userInfo?.username || 'User'}</span>!
        </p>
        <p class="text-xs text-slate-400">
          To continue, please verify that you're accessing your own profile by clicking the verify button below.
        </p>
      </div>

      <div class="space-y-3">
        <div class="bg-slate-900/50 border border-slate-600 rounded-lg p-3">
          <h3 class="text-sm font-semibold text-slate-200 mb-2">What we'll check:</h3>
          <ul class="text-xs text-slate-400 space-y-1">
            <li class="flex items-center gap-2">
              <svg class="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              "Edit profile" button
            </li>
            <li class="flex items-center gap-2">
              <svg class="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              "View archive" or similar options
            </li>
            <li class="flex items-center gap-2">
              <svg class="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Owner-only profile features
            </li>
          </ul>
        </div>

        {#if verificationMessage}
          <div class={`border rounded-lg p-3 text-sm ${
            isVerified 
              ? 'bg-emerald-900/30 border-emerald-600/50 text-emerald-300' 
              : profileOwnedByUser === false
              ? 'bg-red-900/30 border-red-600/50 text-red-300'
              : 'bg-blue-900/30 border-blue-600/50 text-blue-300'
          }`}>
            <p class="font-medium">{verificationMessage}</p>
            {#if errorDetails}
              <p class="text-xs mt-2 opacity-90">{errorDetails}</p>
            {/if}
          </div>
        {/if}
      </div>

      <button
        on:click={verifyAccount}
        disabled={isVerifying || isVerified}
        class={`w-full py-3 rounded-lg font-semibold text-center transition-all duration-300 flex items-center justify-center gap-2 ${
          isVerified
            ? 'bg-emerald-600/40 text-emerald-300 cursor-not-allowed'
            : isVerifying
            ? 'bg-slate-700 text-slate-400 cursor-wait'
            : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 hover:from-emerald-400 hover:to-cyan-400 active:scale-95'
        }`}
      >
        {#if isVerifying}
          <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Verifying...
        {:else if isVerified}
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
          Verified!
        {:else}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {profileOwnedByUser === false ? 'Try Again' : 'Verify Now'}
        {/if}
      </button>

      {#if errorDetails && !isVerified}
        <div class="bg-slate-900/50 border border-slate-600 rounded-lg p-3">
          <h3 class="text-xs font-semibold text-slate-300 mb-2">💡 Troubleshooting tips:</h3>
          <ul class="text-xs text-slate-400 space-y-1">
            <li class="flex items-start gap-2">
              <span class="text-emerald-400 mt-0.5">→</span>
              <span>Make sure you're logged in to the correct account</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-emerald-400 mt-0.5">→</span>
              <span>Navigate directly to your profile (not someone else's)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-emerald-400 mt-0.5">→</span>
              <span>Wait for the page to fully load, then try again</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-emerald-400 mt-0.5">→</span>
              <span>Refresh the page if verification keeps failing</span>
            </li>
          </ul>
        </div>
      {/if}
    </div>
  </div>
</div>
