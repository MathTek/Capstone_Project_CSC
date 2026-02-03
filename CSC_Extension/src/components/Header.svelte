<script>
  export let status = '';
  export let profileInfo = {};
  export let instagramPageInfo = {};
</script>

<header class="bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 shadow-md">
  <div class="px-5 py-6 text-center">
    <h1 class="text-2xl md:text-3xl font-black tracking-tight leading-tight">
      CSC Instagram Analyzer
    </h1>

    <div class="mt-2">
      <span class="text-base md:text-lg font-semibold">
        Hello, {profileInfo.username || 'User'}!
      </span>
    </div>

    {#if instagramPageInfo.username}
      <div class="mt-4 flex flex-wrap justify-center gap-2 text-sm md:text-base">
        <span class="font-semibold">@{instagramPageInfo.username}</span>
        <span class="opacity-80">• {instagramPageInfo.followers} followers</span>
        <span class="opacity-80">• {instagramPageInfo.following} following</span>
      </div>
    {/if}

    {#if status}
      <div class="mt-4">
        <span class="inline-block text-xs md:text-sm font-medium bg-white/40 text-slate-900 rounded-full px-3 py-1">
          {status}
        </span>
      </div>
    {/if}
  </div>
</header>
