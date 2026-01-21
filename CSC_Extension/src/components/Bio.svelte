<script>
  export let bio;
</script>

<div class="card bg-slate-900/50 shadow-md border border-slate-700 rounded-2xl">
  <div class="card-body">
    <h2 class="card-title text-cyan-300">🧬 Bio</h2>
    <p class="line-clamp-4 text-sm leading-relaxed text-slate-300">{bio}</p>
  </div>
</div>

<style>
  .line-clamp-4 {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
