console.log("🚀 CSC Extension Content Script loaded");

// === FONCTION POUR RÉCUPÉRER LA BIO ===
function getInstagramBio() {
  console.log("🔍 Searching for Instagram bio...");
  
  // Sélecteurs pour la bio (ordre de priorité)
  const bioSelectors = [
    'header section > div:last-child', // Section principale de la bio
    'header section div[dir="auto"]', // Texte avec direction auto
    'header section span[dir="auto"]', // Span avec direction auto
    'header div[data-testid*="bio"]', // Testid bio
    'header section div:nth-child(3)', // Troisième div de la section
    'header section > div > div > div', // Structure imbriquée
  ];

  for (let selector of bioSelectors) {
    const elements = [...document.querySelectorAll(selector)];
    for (let el of elements) {
      const text = el.innerText?.trim();
      if (text && text.length > 10 && 
          !text.match(/abonnés|followers|following|publications|posts|^@/i) &&
          !text.match(/^\d+$/)) {
        console.log("✅ Bio found:", text);
        return text;
      }
    }
  }
  
  console.log("❌ No bio found");
  return null;
}

// === FONCTION POUR RÉCUPÉRER TOUS LES POSTS DU PROFIL ===
async function getAllProfilePosts() {
  console.log("🔍 Searching for ALL posts (posts + reels + tv)...");

  const posts = [];
  const collected = document.querySelectorAll(
    'a[href*="/p/"], a[href*="/reel/"], a[href*="/tv/"]'
  );


  let index = 1;

  for (const item of collected) {
    const href = item.href;
    

    posts.push({
      content: null, // sera rempli par getSinglePostContent()
      url: href,
      index: index++,
      type: href.includes("/reel/") ? "reel" : href.includes("/tv/") ? "video" : "post"
    });
  }

//   console.log(`📍 Total found: ${posts.length}`);
  return posts;
}


// === FONCTION POUR UN POST INDIVIDUEL ===
function getSinglePostContent() {
  const postSelectors = [
    'div[data-testid="post-comment-root"] span[dir="auto"]',
    'div[data-testid="caption"] span',
    'article h1',
    'article span[dir="auto"]',
    'header + div span[dir="auto"]',
    'section article ul li div div span'
  ];

  for (let selector of postSelectors) {
    const el = document.querySelector(selector);
    if (el && el.innerText && el.innerText.trim().length > 5) {
      return el.innerText.trim();
    }
  }

  return "(No caption found)";
}

async function fetchFullPostsDetails(posts) {
  for (let post of posts) {
    
    const elements = [...document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"], a[href*="/tv/"]')];
    const el = elements.find(a => a.href.includes(post.url));
    
    if (el) {
      el.click();
      await new Promise(res => setTimeout(res, 1400)); // temps pour afficher
    }

    post.content = getSinglePostContent();
    // console.log("📌 Caption extracted:", post.content);

    await new Promise(res => setTimeout(res, 350)); // anti freeze Instagram
  }

  return posts;
}


// === FONCTION PRINCIPALE POUR RÉCUPÉRER TOUT LE PROFIL ===
async function getFullProfileData() {
//   console.log("🎯 Getting full Instagram profile data...");
  
  const profileData = {
    bio: getInstagramBio(),
    posts: await fetchFullPostsDetails(await getAllProfilePosts()),
    username: null,
    followers: null,
    following: null,
    postsCount: null,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };

  // Récupérer le nom d'utilisateur
  const usernameEl = document.querySelector('header h2, header h1, h1');
  if (usernameEl) {
    profileData.username = usernameEl.innerText?.trim();
  }

  // Récupérer les stats (followers, etc.)
  const statsElements = [...document.querySelectorAll('header section ul li, header section > div a')];
  statsElements.forEach(el => {
    const text = el.innerText?.toLowerCase();
    if (text?.includes('abonnés') || text?.includes('followers')) {
      const match = text.match(/(\d+)/);
      if (match) profileData.followers = parseInt(match[1]);
    } else if (text?.includes('suivi') || text?.includes('following')) {
      const match = text.match(/(\d+)/);
      if (match) profileData.following = parseInt(match[1]);
    } else if (text?.includes('publications') || text?.includes('posts')) {
      const match = text.match(/(\d+)/);
      if (match) profileData.postsCount = parseInt(match[1]);
    }
  });

  console.log("📊 Profile data summary:", {
    username: profileData.username,
    bio: profileData.bio ? 'Found' : 'Not found',
    postsFound: profileData.posts.length,
    followers: profileData.followers
  });

  return profileData;
}

// === FONCTION AVEC ATTENTE ===
function waitForProfileData(maxMs = 5000) {
  return new Promise((resolve) => {
    const start = performance.now();
    
    async function check() {
      const data = await getFullProfileData();
      
      // Considérer comme succès si on a au moins la bio OU des posts
      if (data.bio || data.posts.length > 0) {
        resolve(data);
        return;
      }
      
      if (performance.now() - start > maxMs) {
        console.log("⏰ Timeout reached, returning partial data");
        resolve(data);
        return;
      }
      
      requestAnimationFrame(check);
    }
    
    check();
  });
}

// === GESTIONNAIRE DE MESSAGES ===
if (typeof chrome !== "undefined" && chrome.runtime) {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log("📨 Content script received message:", msg);
    
    if (msg.action === "getBio") {
      console.log("🎯 Getting Instagram bio only...");
      try {
        const bio = getInstagramBio();
        console.log("📤 Sending bio:", bio);
        sendResponse({ bio });
      } catch (error) {
        console.error("❌ Error getting bio:", error);
        sendResponse({ bio: null, error: error.message });
      }
      return false; // Réponse synchrone
    }
    
    if (msg.action === "getFullProfile") {
      console.log("🎯 Getting full Instagram profile...");
      waitForProfileData()
        .then(profileData => {
          console.log("📤 Sending full profile data:", profileData);
          sendResponse(profileData);
        })
        .catch(error => {
          console.error("❌ Error getting full profile:", error);
          sendResponse({ 
            bio: null, 
            posts: [], 
            username: null,
            error: error.message 
          });
        });
      return true; // Réponse asynchrone
    }
    
    // Compatibilité avec l'ancien système
    if (msg.action === "getPost") {
      console.log("🎯 Getting full profile (legacy getPost)...");
      waitForProfileData()
        .then(profileData => {
          // Retourner dans l'ancien format pour compatibilité
          const response = {
            content: profileData.bio,
            posts: profileData.posts,
            metadata: {
              username: profileData.username,
              followers: profileData.followers,
              following: profileData.following,
              postsCount: profileData.postsCount
            }
          };
          console.log("📤 Sending profile data (legacy format):", response);
          sendResponse(response);
        })
        .catch(error => {
          console.error("❌ Error getting posts:", error);
          sendResponse({
            content: null,
            posts: [],
            metadata: {},
            error: error.message
          });
        });
      return true; // Réponse asynchrone
    }
    
    console.log("⚠️ Unknown action:", msg.action);
    sendResponse({ error: "Unknown action: " + msg.action });
    return false;
  });
} else {
  console.warn("⚠️ Chrome runtime not available");
}

console.log("✅ CSC Extension Content Script - Ready!");