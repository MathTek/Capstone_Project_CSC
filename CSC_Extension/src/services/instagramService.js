import { detectPII } from '../utils/piiDetector.js';
import { AuthStorageService } from './authStorage.js';


const browserAPI = (typeof browser !== "undefined" && browser.runtime) ? browser : chrome;
const isFirefox = typeof browser !== "undefined" && browser.runtime;


async function browserFetch(url, options) {

  if (isFirefox) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(options.method || 'GET', url);
      
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }
      
      xhr.onload = () => {
        resolve({
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          json: async () => JSON.parse(xhr.responseText),
          text: async () => xhr.responseText
        });
      };
      
      xhr.onerror = () => reject(new Error('Network request failed'));
      xhr.ontimeout = () => reject(new Error('Request timeout'));
      xhr.timeout = 10000;
      
      xhr.send(options.body);
    });
  }
  
 
  return await fetch(url, options);
}

export async function checkInstagramPage(status) {
  return new Promise((resolve) => {
    browserAPI.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const currentTab = tabs[0];
      
      if (!currentTab.url.includes('instagram.com')) {
        status.set("Please navigate to an Instagram profile");
        resolve(false);
        return;
      }
      
      if (!currentTab.url.includes('/') || currentTab.url.endsWith('instagram.com/') || currentTab.url.endsWith('instagram.com')) {
        status.set("Please navigate to a specific Instagram profile");
        resolve(false);
        return;
      }
      
      status.set("Instagram profile detected - Ready to scan");
      resolve(true);
    });
  });
}

async function sendPIIList(piiList) {
  try {
    const userId = (await AuthStorageService.getAuthState()).userInfo.id;
    if (!userId) {
      console.error("User ID not found in auth state");
      return null;
    }
    const response = await browserFetch(`${import.meta.env.VITE_BACKEND_URL}/calculate_score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ pii_list: piiList, user_id: userId })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Score calculation failed:", errorData);
      return null;
    }

    const data = await response.json();
    return data.score;

  } catch (err) {
    console.error("Network or server error:", err);
    return null;
  }
}


export async function extractProfileData(status, bio, posts, profileInfo, results, numberOfPII,loading, highlights, pii_types_number) {
  browserAPI.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const currentTab = tabs[0];
    
    if (!currentTab.url.includes('instagram.com')) {
      status.set("Please navigate to an Instagram profile");
      loading.set(false);
      return;
    }
    
    status.set("Checking content script...");
    
    try {
      await browserAPI.scripting.executeScript({
        target: { tabId: currentTab.id },
        files: ['content.js']
      });
    } catch (error) {
     
    }
    
    setTimeout(() => {
      status.set("Automatic profile data extraction...");
      
      const messageTimeout = setTimeout(() => {
        loading.set(false);
      }, 10000); 
      
      browserAPI.tabs.sendMessage(
        currentTab.id,
        { action: "getFullProfile" },
        (response) => {
          clearTimeout(messageTimeout);
          
          if (browserAPI.runtime.lastError) {
            status.set("Error: " + browserAPI.runtime.lastError.message);
            loading.set(false);
            return;
          }
          
          if (response) {
            if (response.error) {
              status.set("Error: " + response.error);
              loading.set(false);
              return;
            }


            const bioText = response.bio || "Aucune bio trouvée";
            bio.set(bioText);
            const bioResults = detectPII(bioText, "bio");
            console.log("Bio PII results:", bioResults);
            results.set(bioResults);

            const highlightsData = response.stories || [];
            highlights.set(highlightsData);

            if (highlightsData.length !== 0) {
              for (const highlight of highlightsData) {
                console.log("Processing highlight:", highlight);
                results.update(n => [...n, ...detectPII(highlight.title, "highlight "+ highlight.index)]);
              }
            }

            const postsData = response.posts || [];
            posts.set(postsData);

            if (postsData.length !== 0) {
              for (const post of postsData) {
                results.update(n => [...n, ...detectPII(post.content, "post "+ post.index)]);
              }
            }

            
            results.subscribe(currentResults => {
              console.log("All PII results:", currentResults);
              let piiList = [];

              currentResults.forEach(element => {
                const src = element.source.split(" ")[0];
                const existingItem = piiList.find(item => item.type === element.type && item.source === src);
                if (existingItem) {
                  existingItem.occurrence += 1;
                } else {
                  piiList.push({ type: element.type, occurrence: 1, source: src });
                }
              });

              console.log("Aggregated PII list:", piiList);
              sendPIIList(piiList)
                .then(score => {
                  if (score !== null) {
                    profileInfo.update(info => ({ ...info, last_score: score }));
                  } else {
                    console.error("Failed to receive score from server");
                  }
                })
                .catch(error => {
                  console.error("Error sending PII list:", error);
                });



              numberOfPII.set(currentResults.length);
              
              
              const piiTypeCounts = [];

              currentResults.forEach(element => {
                if (!piiTypeCounts.includes(element.type)) {
                  
                  piiTypeCounts.push(element.type);
                }
              });
              pii_types_number.set(piiTypeCounts);

            });

            profileInfo.set({
              username: response.username,
              followers: response.followers,
              following: response.following,
              postsCount: response.postsCount || postsData.length,
              url: response.url
            });

            console.log("Profile Info:", {profileInfo});

            const postsCount = postsData.length;
            const bioStatus = response.bio ? 'Bio' : 'No Bio';
            status.set(`Extraction completed: ${bioStatus}, ${postsCount} posts and ${highlightsData.length} highlights were found`);
          } else {
            status.set("No data received from content script");
            bio.set("Aucune donnée disponible");
          }
          
          loading.set(false);
        }
      );
    }, 1500);
  });
}

export function reloadInstagramPage(status, loading) {
  browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    browserAPI.tabs.reload(tabs[0].id, () => {
      status.set("Page reloaded. Wait for reload then click Refresh.");
      loading.set(false);
    });
  });
}
