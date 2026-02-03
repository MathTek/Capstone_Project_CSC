<script>
  export let results = [];

  let copiedIndex = null;

  const typeColors = {
    email: "bg-emerald-100 text-emerald-800",
    phone: "bg-cyan-100 text-cyan-800",
    ssn: "bg-rose-100 text-rose-800",
    ip: "bg-violet-100 text-violet-800",
    name: "bg-amber-100 text-amber-800",
    default: "bg-slate-100 text-slate-800"
  };

  $: count = results?.length ?? 0;

  function badgeClass(type) {
    const colors = typeColors[type?.toLowerCase()] ?? typeColors.default;
    return `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors}`;
  }

  function prettyType(type) {
    return String(type ?? "Unknown").replace(/^\w/, (c) => c.toUpperCase());
  }

  async function copyValue(idx, value) {
    try {
      await navigator.clipboard.writeText(String(value));
      copiedIndex = idx;
     
      setTimeout(() => (copiedIndex = null), 1500);
    } catch {
   
    }
  }
</script>

<div class="max-w-3xl mx-auto"></div>
  <section class="card bg-gradient-to-br from-slate-900/70 to-slate-800/60 shadow-lg border border-slate-700 rounded-2xl overflow-hidden">
    <header class="flex items-start justify-between gap-4 p-5">
      <div>
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-700/20 text-emerald-300 text-lg">
            🔒
          </div>
          <div>
            <h2 class="text-2xl font-semibold text-emerald-200 leading-tight">Detected Data</h2>
            <p class="text-sm text-slate-400 mt-0.5">Sensitive items found in the provided content.</p>
          </div>
        </div>
      </div>

      <div class="text-right">
        <div class="text-xs text-slate-400">Total</div>
        <div class="font-semibold text-emerald-200 text-2xl">{count}</div>
      </div>
    </header>

    <div class="p-5 border-t border-slate-700 bg-slate-900/30">
      {#if count === 0}
        <div class="rounded-lg p-4 bg-emerald-500/8 border border-emerald-400/10 flex items-center gap-4">
          <div>
            <div class="text-sm font-medium text-emerald-100">No PII detected</div>
            <div class="text-xs text-slate-400">Your content looks clean.</div>
          </div>
        </div>
      {:else}
        <div class="space-y-4">
          <h3 class="font-semibold text-sm text-slate-400">Details</h3>

          <ul class="bg-slate-800/80 rounded-xl border border-slate-700 max-h-72 overflow-y-auto divide-y divide-slate-700">
            {#each results as item, i}
              <li class="p-3 hover:bg-slate-700/40 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3">
                      <button
                        class="text-left w-full"
                        on:click={() => copyValue(i, item.value)}
                        title="Click to copy value"
                        aria-label={"Copy value " + (item.value ?? "")}
                      >
                        <div class="flex items-center gap-3">
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                              <span class="font-mono text-xs truncate text-emerald-100 max-w-[26rem]">{item.value}</span>
                              <span class={badgeClass(item.type)}>{prettyType(item.type)}</span>
                            </div>
                            <div class="text-xs text-slate-400 mt-1 flex items-center gap-2">
                              <span class="inline-block px-2 py-0.5 rounded text-xs bg-slate-800/50 border border-slate-700 text-cyan-300">{item.source}</span>
                              <span class="inline-block">Position: <span class="font-medium text-slate-200">{i}</span></span>
                            </div>
                          </div>

                          <div class="flex items-center gap-2 pl-3">
                            {#if copiedIndex === i}
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clip-rule="evenodd" />
                              </svg>
                            {:else}
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16h8M8 12h8M8 8h8M5 20h14" />
                              </svg>
                            {/if}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>

    <div aria-live="polite" class="sr-only">
      {#if copiedIndex !== null}
        Copied: {results[copiedIndex]?.value}
      {/if}
    </div>
  </section>
