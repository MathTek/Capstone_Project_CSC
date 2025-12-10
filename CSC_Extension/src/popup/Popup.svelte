<script>
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  const bio = writable("Chargement de la bio...");
  const posts = writable([]);
  const loading = writable(true);
  const profileInfo = writable({});
  const status = writable("Extraction automatique en cours...");

  onMount(async () => {
    console.log("🚀 Popup loaded, starting automatic extraction...");
    
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const currentTab = tabs[0];
      
      if (!currentTab.url.includes('instagram.com')) {
        status.set("❌ Veuillez naviguer vers un profil Instagram");
        loading.set(false);
        return;
      }
      
      status.set("🔄 Vérification du content script...");
      
      try {
        await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          files: ['content.js']
        });
        console.log("✅ Content script injecté avec succès");
      } catch (error) {
        console.log("ℹ️ Content script probablement déjà présent:", error.message);
      }
      
      setTimeout(() => {
        status.set("🔍 Extraction automatique des données du profil...");
        
        const messageTimeout = setTimeout(() => {
          console.error("⏰ Timeout: Aucune réponse du content script");
          status.set("❌ Timeout: Content script ne répond pas. Rechargez la page.");
          loading.set(false);
        }, 10000); 
        
        chrome.tabs.sendMessage(
          currentTab.id,
          { action: "getFullProfile" },
          (response) => {
            clearTimeout(messageTimeout);
            
            if (chrome.runtime.lastError) {
              console.error("❌ Erreur de communication:", chrome.runtime.lastError.message);
              status.set("❌ Erreur: " + chrome.runtime.lastError.message);
              loading.set(false);
              return;
            }
            
            console.log("📦 Full profile data received:", response);
            
            if (response) {
              if (response.error) {
                console.error("❌ Erreur du content script:", response.error);
                status.set("❌ Erreur: " + response.error);
                loading.set(false);
                return;
              }
              
              bio.set(response.bio || "Aucune bio trouvée");
              
              posts.set(response.posts || []);
              
              profileInfo.set({
                username: response.username,
                followers: response.followers,
                following: response.following,
                postsCount: response.postsCount || (response.posts || []).length,
                url: response.url
              });
              
              const postsCount = (response.posts || []).length;
              const bioStatus = response.bio ? '✓ Bio' : '✗ Bio';
              status.set(`✅ Extraction terminée: ${bioStatus}, ${postsCount} posts trouvés`);
            } else {
              status.set("❌ Aucune donnée reçue du content script");
              bio.set("Aucune donnée disponible");
            }
            
            loading.set(false);
          }
        );
      }, 1500);
    });
  });

  async function refreshData() {
    loading.set(true);
    status.set("🔄 Nouvelle extraction en cours...");
    bio.set("Rechargement...");
    posts.set([]);
    
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const currentTab = tabs[0];
      
      try {
        await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          files: ['content.js']
        });
        console.log("✅ Content script re-injecté");
      } catch (error) {
        console.log("ℹ️ Content script déjà présent");
      }
      
      setTimeout(() => {
        const refreshTimeout = setTimeout(() => {
          console.error("⏰ Refresh timeout");
          status.set("❌ Timeout lors du rafraîchissement");
          loading.set(false);
        }, 8000);
        
        chrome.tabs.sendMessage(
          currentTab.id,
          { action: "getFullProfile" },
          (response) => {
            clearTimeout(refreshTimeout);
            
            if (chrome.runtime.lastError) {
              console.error("❌ Erreur de communication:", chrome.runtime.lastError.message);
              status.set("❌ Erreur: " + chrome.runtime.lastError.message);
              loading.set(false);
              return;
            }
            
            if (response) {
              if (response.error) {
                console.error("❌ Erreur du content script:", response.error);
                status.set("❌ Erreur: " + response.error);
                loading.set(false);
                return;
              }
              
              bio.set(response.bio || "Aucune bio trouvée");
              posts.set(response.posts || []);
              profileInfo.set({
                username: response.username,
                followers: response.followers,
                following: response.following,
                postsCount: response.postsCount || (response.posts || []).length,
                url: response.url
              });
              
              const postsCount = (response.posts || []).length;
              const bioStatus = response.bio ? '✓ Bio' : '✗ Bio';
              status.set(`✅ Rafraîchissement terminé: ${bioStatus}, ${postsCount} posts trouvés`);
            } else {
              status.set("❌ Échec du rafraîchissement - Aucune donnée reçue");
            }
            loading.set(false);
          }
        );
      }, 800);
    });
  }

  function reloadInstagramPage() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.reload(tabs[0].id, () => {
        status.set("🔄 Page rechargée. Attendez le rechargement puis cliquez sur Actualiser.");
        loading.set(false);
      });
    });
  }

  function debugPage() {
    status.set("🔧 Analyse de la structure de la page...");
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "debug" },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("❌ Erreur debug:", chrome.runtime.lastError.message);
            status.set("❌ Erreur de debug");
            return;
          }
          
          if (response && response.debug) {
            const debug = response.debug;
            status.set(`🔧 Debug: ${debug.postLinks} liens posts, ${debug.images} images, ${debug.articles} articles`);
            console.log("🔧 Debug info:", debug);
          } else {
            status.set("❌ Pas d'infos de debug reçues");
          }
        }
      );
    });
  }
</script>

<div class="w-full max-w-md mx-auto min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600 p-2">
  <div class="bg-base-100/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden space-y-4">
    
    <div class="bg-gradient-to-r from-primary to-secondary p-4 text-white">
      <h1 class="font-bold text-lg">🔍 CSC Instagram Analyzer</h1>
      <p class="text-xs opacity-90">{$status}</p>
      {#if $profileInfo.username}
        <div class="mt-2 text-sm">
          <span class="font-medium">@{$profileInfo.username}</span>
          {#if $profileInfo.followers}
            <span class="ml-2 opacity-75">{$profileInfo.followers} abonnés</span>
          {/if}
        </div>
      {/if}
    </div>

    <div class="px-4 pb-4 space-y-4">
      {#if $loading}
        <div class="flex items-center justify-center p-4">
          <span class="loading loading-spinner loading-md"></span>
          <span class="ml-2">Extraction en cours...</span>
        </div>
      {/if}

      <div class="flex gap-1 justify-center flex-wrap">
        <button class="btn btn-sm btn-outline" on:click={refreshData} disabled={$loading}>
          🔄 Actualiser
        </button>
        <button class="btn btn-sm btn-secondary" on:click={reloadInstagramPage}>
          🔄 Recharger Page
        </button>
        <button class="btn btn-sm btn-info" on:click={debugPage}>
          🔧 Debug
        </button>
      </div>

      <div class="card bg-base-100 shadow-lg">
        <div class="card-body p-4">
          <h2 class="card-title text-sm mb-3">📋 Bio Instagram</h2>
          <div class="bg-base-200 p-3 rounded-lg max-h-24 overflow-y-auto">
            <p class="text-xs whitespace-pre-wrap">{$bio}</p>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-lg">
        <div class="card-body p-4">
          <h2 class="card-title text-sm mb-3">
            📝 Posts du Profil 
            <span class="badge badge-primary badge-sm">{$posts.length}</span>
          </h2>
          
          {#if $posts.length > 0}
            <div class="space-y-3 max-h-60 overflow-y-auto">
              {#each $posts as post, index}
                <div class="bg-base-200 p-3 rounded-lg border-l-2 border-primary">
                  <div class="flex items-start justify-between mb-2">
                    <span class="text-xs font-bold text-primary">Post #{post.index || index + 1}</span>
                    <span class="text-xs opacity-60">{post.type || 'grid'}</span>
                  </div>
                  <p class="text-xs whitespace-pre-wrap line-clamp-4">
                    {post.content || post}
                  </p>
                  {#if post.url}
                    <a href={post.url} target="_blank" class="text-xs text-primary hover:underline mt-1 inline-block">
                      🔗 Voir le post
                    </a>
                  {/if}
                </div>
              {/each}
            </div>
          {:else if !$loading}
            <div class="bg-base-200 p-3 rounded-lg text-center">
              <p class="text-xs opacity-60">Aucun post trouvé sur cette page</p>
            </div>
          {/if}
        </div>
      </div>

      {#if !$loading && ($bio !== "Aucune bio trouvée" || $posts.length > 0)}
        <div class="card bg-success/10 shadow-lg">
          <div class="card-body p-4">
            <h3 class="card-title text-sm text-success mb-2">✅ Résumé de l'extraction</h3>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="stat">
                <div class="stat-title text-xs">Bio</div>
                <div class="stat-value text-sm">{$bio !== "Aucune bio trouvée" ? "✓" : "✗"}</div>
              </div>
              <div class="stat">
                <div class="stat-title text-xs">Posts</div>
                <div class="stat-value text-sm">{$posts.length}</div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .line-clamp-4 {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
