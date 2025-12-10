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
function getAllProfilePosts() {
  console.log("🔍 Searching for all posts in profile...");
  
  const posts = [];
  
  // Sélecteurs pour les posts dans la grille du profil
  const postGridSelectors = [
    'article', // Articles (posts)
    'div[role="button"] img[alt]', // Images avec alt (descriptions)
    'a[href*="/p/"] img[alt]', // Liens vers posts avec images
    'div._ac7v img[alt]', // Nouveau format de grille
  ];

  // Récupérer les posts de la grille
  const gridItems = document.querySelectorAll('a[href*="/p/"]');
  
  gridItems.forEach((item, index) => {
    const img = item.querySelector('img');
    const altText = img?.alt || '';
    const href = item.href;
    
    // Filtrer les alts qui contiennent du contenu utile
    if (altText && altText.length > 10 && 
        !altText.match(/^(Photo de|Photo by|Image may contain)/i) &&
        !altText.match(/^\d+\s*(j'aime|likes)/i)) {
      
      posts.push({
        content: altText,
        url: href,
        index: index + 1,
        type: 'grid_post'
      });
      
      console.log(`📝 Post ${index + 1} found:`, altText.substring(0, 100) + '...');
    }
  });

  // Si on est sur un post individuel, récupérer aussi son contenu
  if (window.location.href.includes('/p/')) {
    const postContent = getSinglePostContent();
    if (postContent) {
      posts.unshift({
        content: postContent,
        url: window.location.href,
        index: 0,
        type: 'individual_post'
      });
    }
  }

  console.log(`✅ Found ${posts.length} posts total`);
  return posts;
}

// === FONCTION POUR UN POST INDIVIDUEL ===
function getSinglePostContent() {
  const postSelectors = [
    'article div[data-testid="post-text"]',
    'article span[dir="auto"]',
    'article div:not([role]) span',
    'article h1',
    'div[data-testid="caption"] span'
  ];

  for (let selector of postSelectors) {
    const elements = [...document.querySelectorAll(selector)];
    for (let el of elements) {
      const text = el.innerText?.trim();
      if (text && text.length > 10 && 
          !text.match(/^(j'aime|like|comment|partager|il y a)/i)) {
        return text;
      }
    }
  }
  return null;
}

// === FONCTION PRINCIPALE POUR RÉCUPÉRER TOUT LE PROFIL ===
function getFullProfileData() {
  console.log("🎯 Getting full Instagram profile data...");
  
  const profileData = {
    bio: getInstagramBio(),
    posts: getAllProfilePosts(),
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
    
    function check() {
      const data = getFullProfileData();
      
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