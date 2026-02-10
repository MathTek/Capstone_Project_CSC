<script>
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { RateLimiter } from '../utils/rateLimiter.js';
  import { AuthStorageService } from '../services/authStorage.js';
  
  export let onStartScan;
  export let loading = false;
  export let hasScanned = false;
  export let isOnInstagram = true;

  let canScan = true;
  let remainingScans = 1;
  let timeUntilNext = 0;
  let checkingLimit = true;

  async function getUserId() {
    const authState = await AuthStorageService.getAuthState();
    console.log('Retrieved auth state:', authState?.userInfo.id);
    return authState?.userInfo?.id || 'anonymous';
  }

  async function checkRateLimit() {
    checkingLimit = true;
    const userId = await getUserId();
    canScan = await RateLimiter.canScan(userId);
    remainingScans = await RateLimiter.getRemainingScans(userId);
    timeUntilNext = await RateLimiter.getTimeUntilNextScan(userId);
    checkingLimit = false;
  }

  async function handleScan() {
    if (!canScan || loading) return;
    
    const userId = await getUserId();
    await RateLimiter.recordScan(userId);
    await checkRateLimit();
    onStartScan();
  }

  onMount(() => {
    checkRateLimit();
    const interval = setInterval(checkRateLimit, 30000);
    return () => clearInterval(interval);
  });
</script>

{#if !hasScanned && isOnInstagram}
  <div class="max-w-xl mx-auto p-4" transition:fade>
    <div class="relative overflow-hidden rounded-2xl border border-slate-700 shadow-2xl bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-800/50 backdrop-blur-md">
      <div class="absolute -top-8 -right-12 w-40 h-40 bg-gradient-to-r from-emerald-400/30 to-cyan-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div class="p-8 text-center">
        <div class="flex items-center justify-center mb-4">
          <div class="w-20 h-20 flex items-center justify-center rounded-full bg-slate-800/50 border border-slate-700">
            <div class="text-4xl animate-emoji">🔒</div>
          </div>
        </div>

        <h2 class="text-2xl font-semibold text-emerald-300 mb-2">Ready to Analyze</h2>
        <p class="text-sm text-slate-400 mb-6">Start a scan of this Instagram profile to detect privacy risks and exposures of personally identifiable information (PII).</p>

        {#if checkingLimit}
          <div class="flex items-center justify-center gap-2 mb-4">
            <span class="loading loading-spinner loading-sm text-emerald-400"></span>
            <span class="text-slate-400 text-sm">Checking scan availability...</span>
          </div>
        {:else if !canScan}
          <div class="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div class="flex items-center justify-center gap-2 text-amber-400 mb-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="font-semibold">Rate Limit Reached</span>
            </div>
            <p class="text-sm text-slate-400">You've reached the maximum number of scans for this hour.</p>
            <p class="text-sm text-amber-300 mt-2">Next scan available in: <strong>{RateLimiter.formatTimeRemaining(timeUntilNext)}</strong></p>
          </div>
        {/if}

        <button
          class="inline-flex items-center justify-center gap-3 px-8 py-3 rounded-full text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-400/25 transition enabled:shadow-lg enabled:transform enabled:hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 border-0"
          on:click={handleScan}
          disabled={loading || !canScan || checkingLimit}
          aria-busy={loading}
          aria-label="Start privacy scan"
        >
          {#if loading}
            <span class="loading loading-spinner"></span>
            <span>Scanning…</span>
          {:else if !canScan}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            <span>Scan Limit Reached</span>
          {:else}
            <span>Start Privacy Scan</span>
          {/if}
        </button>

        <div class="mt-4 text-xs text-slate-500 space-y-1">
          <p class="flex items-center justify-center gap-2"><span class="text-emerald-300"></span>Instagram profile detected</p>
          {#if !checkingLimit && canScan}
            <p class="flex items-center justify-center gap-2 text-slate-400">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              {remainingScans} scan{remainingScans !== 1 ? 's' : ''} remaining this hour
            </p>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes emoji-pulse {
    0% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-6px) scale(1.06); }
    100% { transform: translateY(0) scale(1); }
  }
  .animate-emoji {
    display: inline-block;
    animation: emoji-pulse 2.4s ease-in-out infinite;
  }
</style>
