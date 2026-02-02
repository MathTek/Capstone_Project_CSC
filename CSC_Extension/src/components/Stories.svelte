<script>
  export let stories;
  
  $: storiesArray = Array.isArray($stories) ? $stories : [];
  
  function copyStoryTitle(title) {
    navigator.clipboard.writeText(title);
  }
</script>

<div class="stories-container">
  <div class="section-header">
    <h3 class="stories-title">
      📖 Stories à la une
      {#if storiesArray.length > 0}
        <span class="count">({storiesArray.length})</span>
      {/if}
    </h3>
  </div>

  {#if storiesArray.length === 0}
    <div class="no-stories">
      <span class="no-stories-text">Aucune story à la une trouvée</span>
    </div>
  {:else}
    <div class="stories-list">
      {#each storiesArray as story}
        <div class="story-item">
          <div class="story-header">
            <span class="story-index">#{story.index}</span>
            <span class="story-type">Story</span>
          </div>
          
          {#if story.title}
            <div class="story-content">
              <div 
                class="story-title" 
                role="button" 
                tabindex="0"
                on:click={() => copyStoryTitle(story.title)}
                on:keydown={(e) => e.key === 'Enter' && copyStoryTitle(story.title)}
              >
                {story.title}
              </div>
            </div>
          {:else}
            <div class="story-content">
              <div class="story-no-title">
                Titre non disponible
              </div>
            </div>
          {/if}
          
          {#if story.imageUrl}
            <div class="story-image-info">
              <small>📷 Image disponible</small>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .stories-container {
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .stories-title {
    margin: 0;
    color: #1d4ed8;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .count {
    color: #6b7280;
    font-size: 14px;
    font-weight: 500;
  }

  .no-stories {
    text-align: center;
    padding: 24px 16px;
    color: #6b7280;
  }

  .no-stories-text {
    font-size: 14px;
    font-style: italic;
  }

  .stories-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .story-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    transition: all 0.2s ease;
  }

  .story-item:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  .story-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .story-index {
    background: #1d4ed8;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .story-type {
    background: #f59e0b;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
  }

  .story-content {
    margin-bottom: 8px;
  }

  .story-title {
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 14px;
    line-height: 1.4;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .story-title:hover {
    border-color: #1d4ed8;
    box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.1);
  }

  .story-no-title {
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 14px;
    font-style: italic;
    color: #92400e;
  }

  .story-image-info {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .story-image-info small {
    color: #6b7280;
    font-size: 12px;
  }
</style>
