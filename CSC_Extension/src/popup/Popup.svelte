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
  import { login, signup, logout } from "../utils/login.js";
  import { AuthStorageService } from "../services/authStorage.js";
  import Auth from "../components/Auth.svelte";
  import ScoreDisplay from "../components/ScoreDisplay.svelte";
  import { scanStores, resetScanStores } from "../services/scanStores.js";

  // ── Scan stores (grouped) ──────────────────────────────────────────────────
  const { status, loading, bio, posts, highlights, profileInfo, results, numberOfPII, pii_types_number } = scanStores;

  // ── UI-only stores ─────────────────────────────────────────────────────────
  const hasScanned      = writable(false);
  const isOnInstagram   = writable(false);
  const isAuthenticated = writable(false);
  const userInfo        = writable(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  async function checkAndSetInstagramPage() {
    setTimeout(async () => {
      const onInstagram = await checkInstagramPage(status);
      isOnInstagram.set(onInstagram);
    }, 100);
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleStartScan() {
    hasScanned.set(true);
    extractProfileData(scanStores);
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

  function handleReloadInstagramPage() {
    reloadInstagramPage(status, loading);
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

  // ── Lifecycle ──────────────────────────────────────────────────────────────

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
      
      <!-- Header -->
      <Header 
        status={$status} 
        profileInfo={$userInfo}
        instagramPageInfo={$profileInfo}
      />
      
      <!-- Body -->
      <div class="px-5 pb-5 pt-4 space-y-4 text-slate-200">
        
        <!-- Loading -->
        <Loading loading={$loading} />

        <!-- Navigate Prompt (when not on Instagram) -->
        {#if !$isOnInstagram && !$loading}
          <NavigatePrompt onNavigateToProfile={handleNavigateToProfile} />
        {/if}

        <!-- Scan Button (when on Instagram but not scanned) -->
        <ScanButton 
          onStartScan={handleStartScan}
          loading={$loading}
          hasScanned={$hasScanned}
          isOnInstagram={$isOnInstagram}
        />

        <!-- Bio (only shown after scan) -->
        {#if $hasScanned}
          <Bio bio={$bio} />
        {/if}

        {#if !$loading && $hasScanned}
          
          <!-- Stats -->
          <Stats 
            numberOfPII={$numberOfPII}
            pii_types_number={$pii_types_number}
          />
          {#if $userInfo.display_content}
            <!-- PII Results -->
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

        <!-- Footer -->
        <Footer 
          onLogout={handleLogout}
          showLogout={true}
        />
      </div>
    </div>
  </div>
{/if}
