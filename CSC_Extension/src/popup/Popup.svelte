<script>
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  const bio = writable("Loading bio...");
  const posts = writable([]);
  const loading = writable(true);
  const profileInfo = writable({});
  const status = writable("Automatic extraction in progress...");
  let results = writable([]);
  const numberOfPII = writable(0);
  const numberOfEmails = writable(0);
  const numberOfPhoneNumbers = writable(0);
  const numberOfCreditCards = writable(0);

function detectPII(text, source) {
  console.log("---------->", text);
  const piiPatterns = [
    { type: "credit_card", pattern: /\b(?:\d[ -]*?){13,19}\b/g },
    { type: "phone", pattern:  /\b\+(?:33|32)[\s.-]?[1-9](?:[\s.-]?\d{2}){4}\b|\+262[\s.-]?\d{3}(?:[\s.-]?\d{2}){3}\b/g },
    { type: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
    // { type: "address_start", pattern: /\b\d{1,5}\s+[A-Za-z][A-Za-z0-9éèàêâôùïüç'’\-\. ]+\b/g }
  ];

  const results = [];
  const detectedValues = new Set();


  for (const { type, pattern } of piiPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const value of matches) {
        if (!detectedValues.has(value)) {
          results.push({ type, value, source });
          detectedValues.add(value);
        }
      }
    }
  }


  if (results.length === 0) {
    console.log("✅ No PII detected");
  }

  return results;
}


  onMount(async () => {
    console.log("🚀 Popup loaded, starting automatic extraction...");
    
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const currentTab = tabs[0];
      
      if (!currentTab.url.includes('instagram.com')) {
        status.set("❌ Please navigate to an Instagram profile");
        loading.set(false);
        return;
      }
      
      status.set("🔄 Checking content script...");
      
      try {
        await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          files: ['content.js']
        });
        console.log("✅ Content script injected successfully");
      } catch (error) {
        console.log("ℹ️ Content script probably already present:", error.message);
      }
      
      setTimeout(() => {
        status.set("🔍 Automatic profile data extraction...");
        
        const messageTimeout = setTimeout(() => {
          console.error("⏰ Timeout: No response from content script");
          status.set("❌ Timeout: Content script not responding. Reload the page.");
          loading.set(false);
        }, 10000); 
        
        chrome.tabs.sendMessage(
          currentTab.id,
          { action: "getFullProfile" },
          (response) => {
            clearTimeout(messageTimeout);
            
            if (chrome.runtime.lastError) {
              console.error("❌ Erreur de communication:", chrome.runtime.lastError.message);
              status.set("❌ Erreur: " + chrome.runtime.lastError.message);
              loading.set(false);
              return;
            }
            
            console.log("📦 Full profile data received:", response);
            
            if (response) {
              if (response.error) {
                console.error("❌ Erreur du content script:", response.error);
                status.set("❌ Erreur: " + response.error);
                loading.set(false);
                return;
              }
              
              bio.set(response.bio || "Aucune bio trouvée");
              results.set(detectPII($bio, "bio"));

              posts.set(response.posts || []);

              if ($posts.length != 0) {
                for (const post of $posts) {
                  // detectPII(post.caption, "post "+ post.id);
                  // console.log("---->", post.content, "from post", post.index);
                  results.update(n => [...n, ...detectPII(post.content, "post "+ post.index)]);
                }
              }

              console.log("🔒 Résultats finaux de la détection PII:", $results);

              numberOfPII.set($results.length);

              $results.forEach(element => {
                switch (element.type) {
                  case "email":
                    $numberOfEmails++;
                    break;
                  case "phone":
                    $numberOfPhoneNumbers++;
                    break;
                  case "credit_card":
                    $numberOfCreditCards++;
                    break;
                }
              });

              console.log("📊 Statistiques PII - Emails:", $numberOfEmails, "Phones:", $numberOfPhoneNumbers, "Credit Cards:", $numberOfCreditCards);

              profileInfo.set({
                username: response.username,
                followers: response.followers,
                following: response.following,
                postsCount: response.postsCount || (response.posts || []).length,
                url: response.url
              });
              
              const postsCount = (response.posts || []).length;
              const bioStatus = response.bio ? '✓ Bio' : '✗ Bio';
              status.set(`✅ Extraction terminée: ${bioStatus}, ${postsCount} posts trouvés`);
            } else {
              status.set("❌ Aucune donnée reçue du content script");
              bio.set("Aucune donnée disponible");
            }
            
            loading.set(false);
          }
        );
      }, 1500);
    });
  });

  async function refreshData() {
    loading.set(true);
    status.set("🔄 New extraction in progress...");
    bio.set("Rechargement...");
    posts.set([]);
    
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const currentTab = tabs[0];
      
      try {
        await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          files: ['content.js']
        });
        console.log("✅ Content script re-injecté");
      } catch (error) {
        console.log("ℹ️ Content script déjà présent");
      }
      
      setTimeout(() => {
        const refreshTimeout = setTimeout(() => {
          console.error("⏰ Refresh timeout");
          status.set("❌ Timeout lors du rafraîchissement");
          loading.set(false);
        }, 8000);
        
        chrome.tabs.sendMessage(
          currentTab.id,
          { action: "getFullProfile" },
          (response) => {
            clearTimeout(refreshTimeout);
            
            if (chrome.runtime.lastError) {
              console.error("❌ Erreur de communication:", chrome.runtime.lastError.message);
              status.set("❌ Erreur: " + chrome.runtime.lastError.message);
              loading.set(false);
              return;
            }
            
            if (response) {
              if (response.error) {
                console.error("❌ Erreur du content script:", response.error);
                status.set("❌ Erreur: " + response.error);
                loading.set(false);
                return;
              }
              
              bio.set(response.bio || "Aucune bio trouvée");
              posts.set(response.posts || []);
              profileInfo.set({
                username: response.username,
                followers: response.followers,
                following: response.following,
                postsCount: response.postsCount || (response.posts || []).length,
                url: response.url
              });
              
              const postsCount = (response.posts || []).length;
              const bioStatus = response.bio ? '✓ Bio' : '✗ Bio';
              status.set(`✅ Rafraîchissement terminé: ${bioStatus}, ${postsCount} posts trouvés`);
            } else {
              status.set("❌ Échec du rafraîchissement - Aucune donnée reçue");
            }
            loading.set(false);
          }
        );
      }, 800);
    });
  }

  function reloadInstagramPage() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.reload(tabs[0].id, () => {
        status.set("🔄 Page reloaded. Wait for reload then click Refresh.");
        loading.set(false);
      });
    });
  }

</script>

<div class="w-full max-w-md mx-auto min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-3">
  <div class="bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
    
    <!-- Header -->
    <div class="bg-gradient-to-r from-emerald-400 to-cyan-400 p-5 text-slate-900 shadow-md">
      <div class="flex items-center justify-between">
        <h1 class="font-extrabold text-xl tracking-tight">🔍 CSC Instagram Analyzer</h1>
        <div class="badge badge-outline badge-lg bg-white/20 border-white/40 text-slate-900">beta</div>
      </div>
      <p class="text-xs mt-1 font-medium">{$status}</p>

      {#if $profileInfo.username}
        <div class="mt-3 text-sm flex items-center gap-2">
          <span class="font-semibold">@{$profileInfo.username}</span>
          {#if $profileInfo.followers}
            <span class="opacity-80">• {$profileInfo.followers} followers</span>
          {/if}
          {#if $profileInfo.following}
            <span class="opacity-80">• {$profileInfo.following} following</span>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Body -->
    <div class="px-5 pb-5 pt-4 space-y-4 text-slate-200">
      
      {#if $loading}
        <div class="flex items-center justify-center p-4">
          <span class="loading loading-spinner loading-lg text-emerald-400"></span>
          <span class="ml-3 font-medium">Extraction in progress...</span>
        </div>
      {/if}

      <!-- Actions -->
      <div class="flex gap-2 justify-center flex-wrap">
        <button class="btn btn-sm btn-outline rounded-full border-emerald-400 text-emerald-300 hover:bg-emerald-400 hover:text-slate-900" 
                on:click={refreshData} disabled={$loading}>
          🔄 Refresh
        </button>

        <button class="btn btn-sm rounded-full bg-cyan-400 text-slate-900 hover:bg-cyan-300" 
                on:click={reloadInstagramPage}>
          ♻️ Reload
        </button>
      </div>

      {#if !$loading}
        
        <!-- Stats -->
        <div class="grid grid-cols-3 gap-3">
          <div class="stat bg-slate-900/60 rounded-2xl border border-slate-700">
            <div class="stat-title text-slate-400">PII total</div>
            <div class="stat-value text-emerald-400">{$numberOfPII}</div>
            <div class="stat-desc">Bio & posts</div>
          </div>

          <div class="stat bg-slate-900/60 rounded-2xl border border-slate-700">
            <div class="stat-title text-slate-400">Emails</div>
            <div class="stat-value text-cyan-300">{$numberOfEmails}</div>
            <div class="stat-desc">Detected</div>
          </div>

          <div class="stat bg-slate-900/60 rounded-2xl border border-slate-700">
            <div class="stat-title text-slate-400">Phones</div>
            <div class="stat-value text-lime-300">{$numberOfPhoneNumbers}</div>
            <div class="stat-desc">International</div>
          </div>
        </div>

        <!-- PII Card -->
        <div class="card bg-slate-900/50 shadow-xl border border-slate-700 rounded-2xl">
          <div class="card-body">
            <h2 class="card-title text-emerald-300">🔒 Detected Data</h2>

            {#if $results.length === 0}
              <div class="alert alert-success bg-emerald-500/20 text-emerald-300 border-emerald-400">
                <span>No PII detected</span>
              </div>
            {:else}
              <div class="space-y-3 max-h-64 overflow-y-auto pr-1">
                <h3 class="font-semibold text-sm text-slate-400">Distribution</h3>

                <div class="flex flex-wrap gap-2">
                  <span class="badge badge-outline border-cyan-400 text-cyan-300">Emails: {$numberOfEmails}</span>
                  <span class="badge badge-outline border-lime-300 text-lime-300">Phones: {$numberOfPhoneNumbers}</span>
                  <span class="badge badge-outline border-rose-400 text-rose-300">Cards: {$numberOfCreditCards}</span>
                </div>

                <h3 class="font-semibold text-sm text-slate-400">Details</h3>

                <ul class="menu menu-sm bg-slate-800/80 rounded-box border border-slate-700">
                  {#each $results as item}
                    <li>
                      <a class="justify-between hover:bg-slate-700/50">
                        <span class="font-mono text-xs truncate max-w-[12rem]">{item.value}</span>
                        <span class="badge badge-ghost text-emerald-300 border-emerald-300 capitalize">{item.type}</span>
                        <span class="badge badge-outline border-cyan-400 text-cyan-300">{item.source}</span>
                      </a>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Bio Card -->
      <div class="card bg-slate-900/50 shadow-md border border-slate-700 rounded-2xl">
        <div class="card-body">
          <h2 class="card-title text-cyan-300">🧬 Bio</h2>
          <p class="line-clamp-4 text-sm leading-relaxed text-slate-300">{$bio}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between text-xs text-slate-500 pt-2">
        <span>Powered by CSC • {new Date().getFullYear()}</span>
        <a class="link text-emerald-400 hover:text-emerald-300" href="https://instagram.com" target="_blank">Open Instagram</a>
      </div>
    </div>
  </div>
</div>


<style>
  .line-clamp-4 {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
