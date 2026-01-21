<script>
  export let onStartScan;
  export let loading;
  export let hasScanned;
  export let isOnInstagram = true;
</script>

{#if !hasScanned && !loading && isOnInstagram}
  <div class="card bg-slate-900/50 shadow-xl border border-slate-700 rounded-2xl">
    <div class="card-body text-center py-8">
      <div class="text-4xl mb-4">🔒</div>
      <h2 class="card-title justify-center text-emerald-300 mb-4">Ready to Analyze</h2>
      <p class="text-slate-400 mb-6">Click the button below to start scanning this Instagram profile for potential privacy risks and PII exposure.</p>
      
      <button 
        class="btn btn-lg bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 hover:from-emerald-300 hover:to-cyan-300 border-0 rounded-full px-8"
        on:click={onStartScan}
        disabled={loading}
      >
        {#if loading}
          <span class="loading loading-spinner loading-sm"></span>
          Scanning...
        {:else}
          🚀 Start Privacy Scan
        {/if}
      </button>
      
      <div class="text-xs text-slate-500 mt-4 space-y-1">
        <p>✅ Instagram profile detected</p>
        <p>🔍 Ready to analyze bio and posts</p>
      </div>
    </div>
  </div>
{/if}
