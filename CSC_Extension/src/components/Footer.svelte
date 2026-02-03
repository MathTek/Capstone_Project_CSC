<script>
  export let onLogout = () => {};
  export let showLogout = false;
  const year = new Date().getFullYear();
</script>

<footer class="mt-6 border-t border-slate-700 pt-4">
  <div class="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-900 font-semibold shadow-md">CSC</div>
      <div class="text-sm text-slate-400 leading-tight">
        <div class="font-medium text-slate-200">Powered by CSC</div>
        <div class="text-xs text-slate-500">© {year} CSC. All rights reserved.</div>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <a href="#" class="text-xs text-slate-400 hover:text-emerald-300 transition">Privacy</a>
      <a href="#" class="text-xs text-slate-400 hover:text-emerald-300 transition">Terms</a>

      <a href="https://github.com" target="_blank" rel="noopener" class="flex items-center gap-2 text-xs text-slate-400 hover:text-emerald-300 transition">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="text-slate-400">
          <path d="M12 .5C5.73.5.75 5.48.75 11.74c0 4.92 3.18 9.09 7.6 10.56.56.1.76-.24.76-.53 0-.26-.01-1-.02-1.96-3.09.67-3.74-1.49-3.74-1.49-.5-1.26-1.22-1.6-1.22-1.6-.99-.68.07-.67.07-.67 1.1.08 1.68 1.13 1.68 1.13.97 1.67 2.55 1.19 3.17.91.1-.71.38-1.19.69-1.46-2.47-.28-5.07-1.23-5.07-5.48 0-1.21.43-2.2 1.13-2.98-.11-.28-.49-1.4.11-2.92 0 0 .92-.3 3.02 1.13a10.5 10.5 0 0 1 2.75-.37c.93 0 1.87.12 2.75.37 2.1-1.44 3.02-1.13 3.02-1.13.6 1.52.22 2.64.11 2.92.7.78 1.13 1.77 1.13 2.98 0 4.26-2.61 5.2-5.09 5.47.39.34.73 1 .73 2.02 0 1.46-.01 2.63-.01 2.99 0 .29.2.64.77.53 4.42-1.48 7.6-5.65 7.6-10.56C23.25 5.48 18.27.5 12 .5z"/>
        </svg>
        <span>Source</span>
      </a>

      {#if showLogout}
        <button 
          on:click={onLogout}
          class="ml-2 inline-flex items-center gap-2 btn btn-sm bg-white/10 text-slate-100 hover:bg-white/20 rounded-full px-3 py-1"
          aria-label="Logout"
          title="Logout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          <span class="text-xs">Logout</span>
        </button>
      {/if}
    </div>
  </div>
</footer>

<style>
  footer a { text-decoration: none; }
</style>
