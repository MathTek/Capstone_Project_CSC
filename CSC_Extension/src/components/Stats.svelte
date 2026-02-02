<script>
  export let numberOfPII;
  export let pii_types_number;
  // export let numberOfEmails;
  // export let numberOfPhoneNumbers;
</script>

<div class="grid grid-cols-3 gap-3">
  <div class="stat bg-slate-900/60 rounded-2xl border border-slate-700">
    <div class="stat-title text-slate-400">PII total</div>
    <div class="stat-value text-emerald-400">{numberOfPII}</div>

  </div>

  <!-- <div class="stat bg-slate-900/60 rounded-2xl border border-slate-700">
    <div class="stat-title text-slate-400">Emails</div>
    <div class="stat-value text-cyan-300">{numberOfEmails}</div>
    <div class="stat-desc">Detected</div>
  </div>

  <div class="stat bg-slate-900/60 rounded-2xl border border-slate-700">
    <div class="stat-title text-slate-400">Phones</div>
    <div class="stat-value text-lime-300">{numberOfPhoneNumbers}</div>
    <div class="stat-desc">International</div>
  </div> -->

  <div class="stat bg-slate-900/60 rounded-2xl border border-slate-700">
    <div class="stat-title text-slate-400">PII Categories</div>
    <div class="stat-value text-emerald-400">{pii_types_number.length}</div>

  </div>
</div>
