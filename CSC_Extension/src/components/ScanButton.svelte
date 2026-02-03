<script>
  import { fade } from 'svelte/transition';
  export let onStartScan;
  export let loading = false;
  export let hasScanned = false;
  export let isOnInstagram = true;
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

        <button
          class="inline-flex items-center justify-center gap-3 px-8 py-3 rounded-full text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-400/25 transition enabled:shadow-lg enabled:transform enabled:hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 border-0"
          on:click={onStartScan}
          disabled={loading}
          aria-busy={loading}
          aria-label="Start privacy scan"
        >
          {#if loading}
            <span class="loading loading-spinner"></span>
            <span>Scanning…</span>
          {:else}
            <span>Start Privacy Scan</span>
          {/if}
        </button>

        <div class="mt-4 text-xs text-slate-500 space-y-1">
          <p class="flex items-center justify-center gap-2"><span class="text-emerald-300"></span>Instagram profile detected</p>
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
