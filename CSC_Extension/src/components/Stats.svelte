<script>
  export let numberOfPII;
  export let pii_types_number;
  // export let numberOfEmails;
  // export let numberOfPhoneNumbers;
</script>

<div>
  <div class="grid grid-cols-3 gap-3">
    <div class="stat bg-slate-900/60 rounded-2xl border border-slate-700">
      <div class="stat-title text-slate-400">PII total</div>
      <div class="stat-value text-emerald-400">{numberOfPII}</div>
      
    </div>
    
    <div class="stat bg-slate-900/60 rounded-2xl border border-slate-700">
      <div class="stat-title text-slate-400">PII Categories</div>
      <div class="stat-value text-emerald-400">{pii_types_number.length}</div>
      
    </div>
  </div>

  <div class="stat bg-slate-900/60 rounded-2xl border border-slate-700">
    <div class="stat-title text-slate-400">PII Types found</div>
    {#each pii_types_number as item}
      <div class="flex justify-between py-1 border-b border-slate-700 last:border-0">
        <div class="text-slate-300">{item}</div>
      </div>
    {/each}
  </div>
</div>
