<script>
    import { fade } from 'svelte/transition';
    export let score;
</script>

  <div class="max-w-xl mx-auto p-4" transition:fade>
    <div class="relative overflow-hidden rounded-2xl border border-slate-700 shadow-2xl bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-800/50 backdrop-blur-md">
      <div class="absolute -top-8 -right-12 w-40 h-40 bg-gradient-to-r from-emerald-400/30 to-cyan-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div class="p-8 text-center">
        <div class="flex items-center justify-center mb-4">
          <div class="w-20 h-20 flex items-center justify-center rounded-full bg-slate-800/50 border border-slate-700">
            <div class="text-4xl animate-emoji">📊</div>
          </div>
        </div>
        <h2 class="text-2xl font-semibold text-emerald-300 mb-2">Privacy Score</h2>
        <p class="text-sm text-slate-400 mb-6">Your Instagram profile privacy score is:</p>
        <div class="text-5xl font-bold text-emerald-400 mb-4">{score.last_score} %</div>
        <p class="text-xs text-slate-500">(0 = High Risk, 100 = Low Risk)</p>
      </div>
    </div>
  </div>
