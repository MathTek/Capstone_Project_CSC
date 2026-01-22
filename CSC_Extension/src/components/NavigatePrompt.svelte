<script>
  export let onNavigateToProfile;
</script>

<div class="card bg-slate-900/50 shadow-xl border border-slate-700 rounded-2xl">
  <div class="card-body text-center py-8">
    <div class="text-6xl mb-4">🔍</div>
    <h2 class="card-title justify-center text-slate-400 mb-4">Navigate to Instagram Profile</h2>
    <p class="text-slate-500 mb-6">
      Please navigate to a specific Instagram profile page to start analyzing privacy risks.
    </p>
    
    <div class="space-y-3">
      <button 
        class="btn btn-outline border-emerald-400 text-emerald-300 hover:bg-emerald-400 hover:text-slate-900 rounded-full"
        on:click={onNavigateToProfile}
      >
        🌐 Open Instagram
      </button>
      
      <div class="text-xs text-slate-600">
        <p>💡 Example: instagram.com/username</p>
      </div>
    </div>
  </div>
</div>
