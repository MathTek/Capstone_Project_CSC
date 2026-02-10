<script>
  export let bio = '';
  let expanded = false;
  const threshold = 260;
  $: needsToggle = bio && bio.length > threshold;
  function toggle() {
    expanded = !expanded;
  }
</script>

<div class="card bg-slate-900/60 shadow-md border border-slate-700 rounded-2xl p-4">
  <div class="flex items-start gap-4">
    <div class="flex-none w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-sky-700 flex items-center justify-center text-white text-xl shadow">
      🧬
    </div>

    <div class="flex-1">
      <div class="flex items-center justify-between">
        <h2 class="text-cyan-300 text-lg font-semibold">Bio</h2>
        <span class="text-sm text-slate-400">Profile</span>
      </div>

      <div class="mt-2 relative">
        <div
          id="bio"
          role="region"
          class="text-sm leading-relaxed text-slate-300 transition-opacity duration-200 bio-content"
          class:bio-scroll={!expanded && needsToggle}
        >
          {bio}
        </div>

        {#if !expanded && needsToggle}
          <div class="fade-pointer" aria-hidden="true"></div>
        {/if}
      </div>

      {#if needsToggle}
        <div class="mt-3">
          <button
            class="text-sm font-medium text-cyan-300 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded px-2 py-1"
            on:click={toggle}
            aria-expanded={expanded}
            aria-controls="bio"
          >
            {#if expanded}Show less{:else}Read more{/if}
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .bio-content {
    white-space: pre-wrap;
  }

  .bio-scroll {
    max-height: 9.5rem; 
    overflow-y: auto;
    padding-right: 0.25rem;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }

  .bio-scroll:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(34,211,238,0.12);
    border-radius: 0.375rem;
  }

  .bio-scroll::-webkit-scrollbar {
    width: 8px;
  }
  .bio-scroll::-webkit-scrollbar-thumb {
    background: rgba(148,163,184,0.22);
    border-radius: 9999px;
  }
  .bio-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(148,163,184,0.34);
  }

  .fade-pointer {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2.4rem;
    background: linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.85) 65%);
    pointer-events: none;
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
  }
</style>
