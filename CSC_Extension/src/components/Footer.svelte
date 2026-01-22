<script>
  export let onLogout = () => {};
  export let showLogout = false;
</script>

<div class="flex items-center justify-between text-xs text-slate-500 pt-2">
  <span>Powered by CSC • {new Date().getFullYear()}</span>
    <div class="flex items-center gap-2">
    {#if showLogout}
      <button 
        on:click={onLogout}
        class="btn btn-xs bg-white/20 border-white/40 text-slate-900 hover:bg-white/30"
      >
        🚪 Logout
      </button>
    {/if}
  </div>
</div>
