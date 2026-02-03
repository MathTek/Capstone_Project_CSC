<script>
  export let status = '';
  export let profileInfo = {};
  export let instagramPageInfo = {};
</script>

<div class="bg-gradient-to-r from-emerald-400 to-cyan-400 p-5 text-slate-900 shadow-md">
  <div class="flex items-center justify-between">
    <h1 class="font-extrabold text-xl tracking-tight">🔍 CSC Instagram Analyzer</h1>
  </div>
  <div class="mt-2">
    <span class="font-semibold text-lg">Hello, {profileInfo.username || 'User'}!</span>
  </div>

  <p class="text-xs mt-1 font-medium">{status}</p>

  {#if instagramPageInfo.username}
    <div class="mt-3 text-sm flex items-center gap-2">
      <span class="font-semibold">@{instagramPageInfo.username}</span>
        <span class="opacity-80">• {instagramPageInfo.followers} followers</span>
        <span class="opacity-80">• {instagramPageInfo.following} following</span>
    </div>
  {/if}
</div>
