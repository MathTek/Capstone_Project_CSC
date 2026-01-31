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
  import { extractProfileData, refreshProfileData, reloadInstagramPage, checkInstagramPage } from "../services/instagramService.js";
  import { login, signup, logout } from "../utils/login.js";  
  import { AuthStorageService } from "../services/authStorage.js";
  import Auth from "../components/Auth.svelte";

  const bio = writable("No bio scanned yet");
  const posts = writable([]);
  const loading = writable(false);
  const profileInfo = writable({});
  const status = writable("Checking Instagram page...");
  let results = writable([]);
  const numberOfPII = writable(0);
  const numberOfEmails = writable(0);
  const numberOfPhoneNumbers = writable(0);
  const numberOfCreditCards = writable(0);
  const hasScanned = writable(false);
  const isOnInstagram = writable(false);
  const isAuthenticated = writable(false);
  const userInfo = writable(null);
  const highlights = writable([]);


  function handleStartScan() {
    hasScanned.set(true);
    extractProfileData(status, bio, posts, profileInfo, results, numberOfPII, numberOfEmails, numberOfPhoneNumbers, numberOfCreditCards, loading, highlights);
  }

  async function handleLogin(username, password) {
    try {
      const success = await login(username, password);
      if (success) {
        isAuthenticated.set(true);
      
        setTimeout(async () => {
          const onInstagram = await checkInstagramPage(status);
          isOnInstagram.set(onInstagram);
        }, 100);
      }
      return success;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  }

  async function handleSignup(username, email, password) {
    try {
      const success = await signup(username, email, password);
      if (success) {
        isAuthenticated.set(true);
        setTimeout(async () => {
          const onInstagram = await checkInstagramPage(status);
          isOnInstagram.set(onInstagram);
        }, 100);
      }
      return success;
    } catch (error) {
      console.error("Signup error:", error);
      return false;
    }
  }

  function handleRefreshData() {
    refreshProfileData(status, bio, posts, profileInfo, results, numberOfPII, numberOfEmails, numberOfPhoneNumbers, numberOfCreditCards, loading, highlights);
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
    hasScanned.set(false);
    results.set([]);
    bio.set("No bio scanned yet");
    posts.set([]);
    profileInfo.set({});
    status.set("Please authenticate to continue");
  }

  onMount(async () => {
  
    try {
      const authState = await AuthStorageService.getAuthState();
      if (authState.isAuthenticated) {
        isAuthenticated.set(true);
        userInfo.set(authState.userInfo);
        
        setTimeout(async () => {
          const onInstagram = await checkInstagramPage(status);
          isOnInstagram.set(onInstagram);
        }, 100);
      } else {
        isAuthenticated.set(false);
        status.set("Please authenticate to continue");
      }
    } catch (error) {
      console.error("Auth check error:", error);
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
        profileInfo={$profileInfo}
        username={$userInfo?.username}
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

        <!-- Actions (only shown after scan) -->
        {#if $hasScanned}
          <Actions 
            refreshData={handleRefreshData} 
            reloadInstagramPage={handleReloadInstagramPage} 
            loading={$loading} 
          />
        {/if}

        {#if !$loading && $hasScanned}
          
          <!-- Stats -->
          <Stats 
            numberOfPII={$numberOfPII}
            numberOfEmails={$numberOfEmails}
            numberOfPhoneNumbers={$numberOfPhoneNumbers}
          />

          <!-- PII Results -->
          <PIIResults 
            results={$results}
            numberOfEmails={$numberOfEmails}
            numberOfPhoneNumbers={$numberOfPhoneNumbers}
            numberOfCreditCards={$numberOfCreditCards}
          />
        {/if}

        <!-- Bio (only shown after scan) -->
        {#if $hasScanned}
          <Bio bio={$bio} />
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
