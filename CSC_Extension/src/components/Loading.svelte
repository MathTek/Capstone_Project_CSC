<script>
  export let loading;
</script>

{#if loading}
  <div class="flex items-center justify-center p-4">
    <span class="loading loading-spinner loading-lg text-emerald-400"></span>
    <span class="ml-3 font-medium">Extraction in progress...</span>
  </div>
{/if}
