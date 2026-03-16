<script>
  // Explicit, typed-like props for clarity and compatibility
  export let status = '';
  export let profileInfo = {};
  export let instagramPageInfo = {};

  // Derived helpers to avoid undefined access crashes
  $: hasProfileUsername = profileInfo && profileInfo.username;
  $: hasInstagramInfo = instagramPageInfo && instagramPageInfo.username !== undefined;
  $: followersLabel = instagramPageInfo?.followers ?? null;
  $: followingLabel = instagramPageInfo?.following ?? null;
</script>

<header class="bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 shadow-md">
  <div class="px-5 py-6 text-center">
    <h1 class="text-2xl md:text-3xl font-black tracking-tight leading-tight">
      CSC Social Media Analyzer
    </h1>

    <div class="mt-2">
      {#if hasProfileUsername}
        <span class="text-base md:text-lg font-semibold">
          Hello, {profileInfo.username || 'User'}!
        </span>
      {/if}
    </div>

    {#if hasInstagramInfo}
      <div class="mt-4 flex flex-wrap justify-center gap-2 text-sm md:text-base">
        <span class="font-semibold">{instagramPageInfo.username}</span>
        {#if followersLabel !== null}
          <span class="opacity-80">• {followersLabel} followers</span>
        {/if}
        {#if followingLabel !== null}
          <span class="opacity-80">• {followingLabel} following</span>
        {/if}
      </div>
    {:else}
      <div class="mt-4">
        <span class="text-sm md:text-base font-medium text-slate-700">
          Launch your first scan to see your profile details here!
        </span>
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
