<script>
  export let results;
</script>

<div class="card bg-slate-900/50 shadow-xl border border-slate-700 rounded-2xl">
  <div class="card-body">
    <h2 class="card-title text-emerald-300">🔒 Detected Data</h2>

    {#if results.length === 0}
      <div class="alert alert-success bg-emerald-500/20 text-emerald-300 border-emerald-400">
        <span>No PII detected</span>
      </div>
    {:else}
      <div class="space-y-3 max-h-64 overflow-y-auto pr-1">

        <h3 class="font-semibold text-sm text-slate-400">Details</h3>

        <ul class="menu menu-sm bg-slate-800/80 rounded-box border border-slate-700">
          {#each results as item}
            <li>
              <div class="flex justify-between hover:bg-slate-700/50 p-2 rounded">
                <span class="font-mono text-xs truncate max-w-[12rem]">{item.value}</span>
                <span class="badge badge-ghost text-emerald-300 border-emerald-300 capitalize">{item.type}</span>
                <span class="badge badge-outline border-cyan-400 text-cyan-300">{item.source}</span>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>
