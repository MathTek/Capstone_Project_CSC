<script>
  export let refreshData;
  export let reloadInstagramPage;
  export let loading;
</script>

<div class="flex gap-2 justify-center flex-wrap">
  <button 
    class="btn btn-sm btn-outline rounded-full border-emerald-400 text-emerald-300 hover:bg-emerald-400 hover:text-slate-900" 
    on:click={refreshData} 
    disabled={loading}
  >
    🔄 Refresh
  </button>

  <button 
    class="btn btn-sm rounded-full bg-cyan-400 text-slate-900 hover:bg-cyan-300" 
    on:click={reloadInstagramPage}
  >
    ♻️ Reload
  </button>
</div>
