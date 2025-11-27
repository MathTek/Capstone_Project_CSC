<script>
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  // store réactif pour la bio
  const bio = writable("Chargement...");

  onMount(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "getBio" },
        (response) => {
          // met à jour le store
          bio.set(response?.bio || "Aucune bio trouvée");
          console.log("Received bio:", response?.bio);
        }
      );
    });
  });
</script>

<div class="w-full max-w-sm mx-auto min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600">
  <div class="bg-base-100/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
    <h2 class="font-bold text-lg">Bio détectée :</h2>
    <p>{$bio}</p> <!-- utilise $ pour accéder à la valeur du store -->
  </div>
</div>
