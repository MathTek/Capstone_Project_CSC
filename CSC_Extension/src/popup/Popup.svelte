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

  // Stores
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

  // Event handlers
  function handleStartScan() {
    hasScanned.set(true);
    extractProfileData(status, bio, posts, profileInfo, results, numberOfPII, numberOfEmails, numberOfPhoneNumbers, numberOfCreditCards, loading);
  }

  function handleRefreshData() {
    refreshProfileData(status, bio, posts, profileInfo, results, numberOfPII, numberOfEmails, numberOfPhoneNumbers, numberOfCreditCards, loading);
  }

  function handleReloadInstagramPage() {
    reloadInstagramPage(status, loading);
  }

  function handleNavigateToProfile() {
    chrome.tabs.create({ url: 'https://www.instagram.com' });
  }

  onMount(async () => {
    // Check if we're on Instagram and update status
    const onInstagram = await checkInstagramPage(status);
    isOnInstagram.set(onInstagram);
  });
</script>

<div class="w-full max-w-md mx-auto min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-3">
  <div class="bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
    
    <!-- Header -->
    <Header status={$status} profileInfo={$profileInfo} />

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
      <Footer />
    </div>
  </div>
</div>
