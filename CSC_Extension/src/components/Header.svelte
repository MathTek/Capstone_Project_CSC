<script>
  export let status;
  export let profileInfo;
</script>

<div class="bg-gradient-to-r from-emerald-400 to-cyan-400 p-5 text-slate-900 shadow-md">
  <div class="flex items-center justify-between">
    <h1 class="font-extrabold text-xl tracking-tight">🔍 CSC Instagram Analyzer</h1>
  </div>
  <div class="mt-2">
    <span class="font-semibold text-lg">Hello, {profileInfo.username || 'User'}!</span>
  </div>

  <p class="text-xs mt-1 font-medium">{status}</p>

  {#if profileInfo.username}
    <div class="mt-3 text-sm flex items-center gap-2">
      <span class="font-semibold">@{profileInfo.username}</span>
        <span class="opacity-80">• {profileInfo.followers} followers</span>
        <span class="opacity-80">• {profileInfo.following} following</span>
    </div>
  {/if}
</div>
