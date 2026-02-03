import { each } from 'chart.js/helpers';
import { detectPII } from '../utils/piiDetector.js';

export async function checkInstagramPage(status) {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
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
    const response = await fetch("http://localhost:8000/calculate_score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ pii_list: piiList })
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


export async function extractProfileData(status, bio, posts, profileInfo, results, numberOfPII, numberOfEmails, numberOfPhoneNumbers, numberOfCreditCards, loading, highlights, pii_types_number) {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const currentTab = tabs[0];
    
    if (!currentTab.url.includes('instagram.com')) {
      status.set("Please navigate to an Instagram profile");
      loading.set(false);
      return;
    }
    
    status.set("Checking content script...");
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        files: ['content.js']
      });
    } catch (error) {
     
    }
    
    setTimeout(() => {
      status.set("Automatic profile data extraction...");
      
      const messageTimeout = setTimeout(() => {
        status.set("Timeout: Content script not responding. Reload the page.");
        loading.set(false);
      }, 10000); 
      
      chrome.tabs.sendMessage(
        currentTab.id,
        { action: "getFullProfile" },
        (response) => {
          clearTimeout(messageTimeout);
          
          if (chrome.runtime.lastError) {
            status.set("Error: " + chrome.runtime.lastError.message);
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
              try {
                sendPIIList(piiList).then(score => {
                  console.log("Calculated score:", score);
                });
              } catch (error) {
                console.error("Error sending PII list:", error);
              }



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
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.reload(tabs[0].id, () => {
      status.set("Page reloaded. Wait for reload then click Refresh.");
      loading.set(false);
    });
  });
}
