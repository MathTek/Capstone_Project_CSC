import { detectPII } from '../utils/piiDetector.js';

export async function checkInstagramPage(status) {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const currentTab = tabs[0];
      
      if (!currentTab.url.includes('instagram.com')) {
        status.set("❌ Please navigate to an Instagram profile");
        resolve(false);
        return;
      }
      
      if (!currentTab.url.includes('/') || currentTab.url.endsWith('instagram.com/') || currentTab.url.endsWith('instagram.com')) {
        status.set("❌ Please navigate to a specific Instagram profile");
        resolve(false);
        return;
      }
      
      status.set("✅ Instagram profile detected - Ready to scan");
      resolve(true);
    });
  });
}

export async function extractProfileData(status, bio, posts, profileInfo, results, numberOfPII, numberOfEmails, numberOfPhoneNumbers, numberOfCreditCards, loading) {
  console.log("🚀 Popup loaded, starting automatic extraction...");
  
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const currentTab = tabs[0];
    
    if (!currentTab.url.includes('instagram.com')) {
      status.set("❌ Please navigate to an Instagram profile");
      loading.set(false);
      return;
    }
    
    status.set("🔄 Checking content script...");
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        files: ['content.js']
      });
      console.log("✅ Content script injected successfully");
    } catch (error) {
      console.log("ℹ️ Content script probably already present:", error.message);
    }
    
    setTimeout(() => {
      status.set("🔍 Automatic profile data extraction...");
      
      const messageTimeout = setTimeout(() => {
        console.error("⏰ Timeout: No response from content script");
        status.set("❌ Timeout: Content script not responding. Reload the page.");
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
            
            // Process bio
            const bioText = response.bio || "Aucune bio trouvée";
            bio.set(bioText);
            
            // Detect PII in bio
            const bioResults = detectPII(bioText, "bio");
            results.set(bioResults);

            // Process posts
            const postsData = response.posts || [];
            posts.set(postsData);

            if (postsData.length !== 0) {
              for (const post of postsData) {
                results.update(n => [...n, ...detectPII(post.content, "post "+ post.index)]);
              }
            }

            console.log("🔒 Résultats finaux de la détection PII:", results);

            // Calculate statistics
            results.subscribe(currentResults => {
              numberOfPII.set(currentResults.length);
              
              let emails = 0, phones = 0, creditCards = 0;
              
              currentResults.forEach(element => {
                switch (element.type) {
                  case "email":
                    emails++;
                    break;
                  case "phone":
                    phones++;
                    break;
                  case "credit_card":
                    creditCards++;
                    break;
                }
              });

              numberOfEmails.set(emails);
              numberOfPhoneNumbers.set(phones);
              numberOfCreditCards.set(creditCards);
            });

            console.log("📊 Statistiques PII");

            profileInfo.set({
              username: response.username,
              followers: response.followers,
              following: response.following,
              postsCount: response.postsCount || postsData.length,
              url: response.url
            });
            
            const postsCount = postsData.length;
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
}

export async function refreshProfileData(status, bio, posts, profileInfo, results, numberOfPII, numberOfEmails, numberOfPhoneNumbers, numberOfCreditCards, loading) {
  loading.set(true);
  status.set("🔄 New extraction in progress...");
  bio.set("Rechargement...");
  posts.set([]);
  results.set([]);
  
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
            
            // Process bio
            const bioText = response.bio || "Aucune bio trouvée";
            bio.set(bioText);
            
            // Detect PII in bio
            const bioResults = detectPII(bioText, "bio");
            results.set(bioResults);

            // Process posts
            const postsData = response.posts || [];
            posts.set(postsData);

            if (postsData.length !== 0) {
              for (const post of postsData) {
                results.update(n => [...n, ...detectPII(post.content, "post "+ post.index)]);
              }
            }

            // Calculate statistics
            results.subscribe(currentResults => {
              numberOfPII.set(currentResults.length);
              
              let emails = 0, phones = 0, creditCards = 0;
              
              currentResults.forEach(element => {
                switch (element.type) {
                  case "email":
                    emails++;
                    break;
                  case "phone":
                    phones++;
                    break;
                  case "credit_card":
                    creditCards++;
                    break;
                }
              });

              numberOfEmails.set(emails);
              numberOfPhoneNumbers.set(phones);
              numberOfCreditCards.set(creditCards);
            });

            profileInfo.set({
              username: response.username,
              followers: response.followers,
              following: response.following,
              postsCount: response.postsCount || postsData.length,
              url: response.url
            });
            
            const postsCount = postsData.length;
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

export function reloadInstagramPage(status, loading) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.reload(tabs[0].id, () => {
      status.set("🔄 Page reloaded. Wait for reload then click Refresh.");
      loading.set(false);
    });
  });
}
