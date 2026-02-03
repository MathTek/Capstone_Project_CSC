<script>
  import { fade } from 'svelte/transition';
  export let numberOfPII = 0;
  export let pii_types_number = [];

  const format = (n) => (typeof n === 'number' ? n.toLocaleString() : n);
</script>

<div class="max-w-3xl mx-auto p-4 space-y-4">
  <header class="flex items-start justify-between">
    <div>
      <h2 class="text-lg sm:text-xl font-semibold text-slate-200">Privacy Scan Summary</h2>
      <p class="text-sm text-slate-400 mt-1">Overview of detected PII in the document</p>
    </div>
    <div class="text-xs text-slate-500 self-end">Live</div>
  </header>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div class="p-4 bg-slate-900/60 rounded-2xl border border-slate-700 shadow-sm">
      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="text-slate-400 text-sm">PII total</div>
          <div class="text-3xl sm:text-4xl font-bold text-emerald-400" aria-live="polite">{format(numberOfPII)}</div>
        </div>
        <div class="text-xs text-slate-400">Detected</div>
      </div>
    </div>

    <div class="p-4 bg-slate-900/60 rounded-2xl border border-slate-700 shadow-sm">
      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="text-slate-400 text-sm">PII Categories</div>
          <div class="text-3xl sm:text-4xl font-bold text-emerald-400">{format(pii_types_number?.length ?? 0)}</div>
        </div>
        <div class="text-xs text-slate-400">Unique types</div>
      </div>
    </div>
  </div>

  <div class="p-4 bg-slate-900/60 rounded-2xl border border-slate-700">
    <div class="flex items-center justify-between mb-3">
      <div class="text-slate-400 text-sm">PII Types found</div>
      <div class="text-xs text-slate-500">{pii_types_number?.length ?? 0} total</div>
    </div>

    {#if pii_types_number && pii_types_number.length}
      <div class="flex flex-wrap gap-2">
        {#each pii_types_number as item (item)}
          <div
            in:fade={{ duration: 150 }}
            class="flex items-center gap-2 px-3 py-1 bg-slate-800/60 text-slate-200 rounded-full border border-slate-700 hover:bg-slate-700/60 transition"
            aria-label={"PII type: " + item}
            role="listitem"
          >
            <span class="text-xs sm:text-sm">{item}</span>
          </div>
        {/each}
      </div>
    {:else}
      <div class="text-slate-500 italic">No PII types detected</div>
    {/if}
  </div>
</div>
