<script>
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import Header from "../components/Header.svelte";
  import Loading from "../components/Loading.svelte";
  import Actions from "../components/Actions.svelte";
  import Stats from "../components/Stats.svelte";
  import PIIResults from "../components/PIIResults.svelte";
  import Bio from "../components/Bio.svelte";
  import Footer from "../components/Footer.svelte";
  import ScanButton from "../components/ScanButton.svelte";
  import NavigatePrompt from "../components/NavigatePrompt.svelte";
  import { extractProfileData, reloadInstagramPage, checkInstagramPage } from "../services/instagramService.js";
  import { extractFacebookProfileData, reloadFacebookPage, checkFacebookPage } from "../services/facebookService.js";
  import { extractXProfileData, reloadXPage, checkXPage } from "../services/xService.js";
  import { login, signup, logout } from "../utils/login.js";
  import { AuthStorageService } from "../services/authStorage.js";
  import Auth from "../components/Auth.svelte";
  import ScoreDisplay from "../components/ScoreDisplay.svelte";
  import { scanStores, resetScanStores } from "../services/scanStores.js";

  const { status, loading, bio, posts, highlights, profileInfo, results, numberOfPII, pii_types_number } = scanStores;

  const hasScanned      = writable(false);
  const isOnInstagram   = writable(false);
  const isOnFacebook    = writable(false);
  const isOnX           = writable(false);
  const isAuthenticated = writable(false);
  const userInfo        = writable(null);

  async function checkAndSetInstagramPage() {
    setTimeout(async () => {
      const onInstagram = await checkInstagramPage(status);
      isOnInstagram.set(onInstagram);
      if (!onInstagram) {
        const onFacebook = await checkFacebookPage(status);
        isOnFacebook.set(onFacebook);
        if (!onFacebook) {
          const onX = await checkXPage(status);
          isOnX.set(onX);
        } else {
          isOnX.set(false);
        }
      } else {
        isOnFacebook.set(false);
        isOnX.set(false);
      }
    }, 100);
  }

  function handleStartScan() {
    hasScanned.set(true);
    if ($isOnFacebook) {
      extractFacebookProfileData(scanStores);
    } else if ($isOnX) {
      extractXProfileData(scanStores);
    } else {
      extractProfileData(scanStores);
    }
  }

  async function handleLogin(username, password) {
    try {
      const success = await login(username, password);
      if (success) {
        const authState = await AuthStorageService.getAuthState();
        userInfo.set(authState.userInfo);
        isAuthenticated.set(true);
        checkAndSetInstagramPage();
      }
      return success;
    } catch (error) {
      console.error('[Popup] Login error:', error);
      return false;
    }
  }

  async function handleSignup(username, email, password, display_consent, cgu) {
    try {
      const success = await signup(username, email, password, display_consent, cgu);
      if (success) {
        const authState = await AuthStorageService.getAuthState();
        userInfo.set(authState.userInfo);
        isAuthenticated.set(true);
        checkAndSetInstagramPage();
      }
      return success;
    } catch (error) {
      console.error('[Popup] Signup error:', error);
      return false;
    }
  }


  function handleNavigateToProfile() {
    chrome.tabs.create({ url: 'https://www.instagram.com' });
  }

  async function handleLogout() {
    await logout();
    isAuthenticated.set(false);
    userInfo.set(null);
    hasScanned.set(false);
    resetScanStores();
  }

  onMount(async () => {
    try {
      const authState = await AuthStorageService.getAuthState();
      if (authState.isAuthenticated) {
        isAuthenticated.set(true);
        userInfo.set(authState.userInfo);
        checkAndSetInstagramPage();
      } else {
        isAuthenticated.set(false);
        status.set('Please authenticate to continue');
      }
    } catch (error) {
      console.error('[Popup] Auth check error:', error);
      isAuthenticated.set(false);
    }
  });
</script>

{#if !$isAuthenticated}
  <Auth 
    isAuthenticated={$isAuthenticated}
    onLogin={handleLogin}
    onSignup={handleSignup}
  />
{:else}
  <div class="w-full max-w-md mx-auto min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-3">
    <div class="bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
      
      <Header 
        status={$status} 
        profileInfo={$userInfo}
        instagramPageInfo={$profileInfo}
      />
      
      <div class="px-5 pb-5 pt-4 space-y-4 text-slate-200">
        
        <Loading loading={$loading} />

        {#if !$isOnInstagram && !$isOnFacebook && !$isOnX && !$loading}
          <NavigatePrompt onNavigateToProfile={handleNavigateToProfile} />
        {/if}

        {#if $isOnFacebook && !$loading}
          <div class="flex items-center gap-2 text-sm font-medium text-blue-300 bg-blue-900/30 border border-blue-700/40 rounded-xl px-3 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 fill-blue-400" viewBox="0 0 24 24">
              <path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
            </svg>
            Facebook profile detected
          </div>
        {/if}

        {#if $isOnX && !$loading}
          <div class="flex items-center gap-2 text-sm font-medium text-slate-100 bg-slate-700/50 border border-slate-500/40 rounded-xl px-3 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 fill-slate-100" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            X profile detected
          </div>
        {/if}

        <ScanButton 
          onStartScan={handleStartScan}
          loading={$loading}
          hasScanned={$hasScanned}
          isOnInstagram={$isOnInstagram || $isOnFacebook || $isOnX}
        />

        {#if $hasScanned}
          <Bio bio={$bio} />
        {/if}

        {#if !$loading && $hasScanned}
          <Stats 
            numberOfPII={$numberOfPII}
            pii_types_number={$pii_types_number}
          />
          {#if $userInfo.display_content}
            <PIIResults 
              results={$results}
            />
          {:else}
            <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
              <p class="font-bold">Consent Not Given</p>
              <p>You didn't give your consent to display PII results.</p>
              <p>Please check your settings to enable PII result display.</p> 
            </div>
          {/if}
          <ScoreDisplay score={$profileInfo} />
        {/if}

        <Footer 
          onLogout={handleLogout}
          showLogout={true}
        />
      </div>
    </div>
  </div>
{/if}
