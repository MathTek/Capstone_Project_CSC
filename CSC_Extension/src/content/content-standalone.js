console.log("🚀 CSC Extension Content Script loaded - ALL-IN-ONE VERSION");

// Établir la connexion avec le popup si chrome est disponible
if (typeof chrome !== "undefined" && chrome.runtime) {
  chrome.runtime.onConnect.addListener((port) => {
    console.log("🔗 Content script connected to popup");
  });
}

// Détecter si on est sur Instagram
if (window.location.hostname.includes("instagram.com")) {
  console.log("✅ CSC Extension: Instagram détecté, prêt pour l'extraction");
} else {
  console.log("⚠️ CSC Extension: Pas sur Instagram");
}

// ===================================================================
// === EXTRACTION BIO INSTAGRAM - AUTONOME ===
// ===================================================================
function getInstagramBio() {
  console.log("🔍 Extracting Instagram bio...");
  
  const bioSelectors = [
    'header section > div:last-child',
    'header section div[dir="auto"]',
    'header section span[dir="auto"]',
    'header div[data-testid*="bio"]',
    'header section div:nth-child(3)',
    'header section > div > div > div',
    'header section div',
    'header section span',
    'header section p'
  ];

  for (let selector of bioSelectors) {
    const elements = [...document.querySelectorAll(selector)];
    for (let el of elements) {
      if (el.offsetParent !== null) { // Élément visible seulement
        const text = el.innerText?.trim();
        if (text && text.length > 10 && 
            !text.match(/abonnés|followers|following|publications|posts|^@/i) &&
            !text.match(/^\d+$/)) {
          console.log("✅ Bio found:", text);
          return text;
        }
      }
    }
  }
  
  console.log("❌ No bio found");
  return null;
}

// ===================================================================
// === EXTRACTION USERNAME PROFIL - AUTONOME ===
// ===================================================================
function getProfileUsername() {
  console.log("🔍 Extracting profile username...");
  
  const usernameSelectors = [
    'header h2',
    'header h1', 
    'h1',
    'header section h1',
    'header section h2'
  ];
  
  for (let selector of usernameSelectors) {
    const element = document.querySelector(selector);
    if (element && element.innerText) {
      const username = element.innerText.trim();
      if (username && !username.match(/^\d+$/) && username.length > 1) {
        console.log("✅ Username found:", username);
        return username;
      }
    }
  }
  
  console.log("❌ Username not found");
  return null;
}

// ===================================================================
// === EXTRACTION STATISTIQUES PROFIL - AUTONOME ===
// ===================================================================
function getProfileStats() {
  console.log("🔍 Extracting profile statistics...");
  
  const stats = {
    followers: null,
    following: null,
    posts: null
  };

  const statsElements = [...document.querySelectorAll('header section ul li, header section > div a, header section span')];
  
  statsElements.forEach(el => {
    const text = el.innerText?.toLowerCase();
    if (text) {
      if (text.includes('abonnés') || text.includes('followers')) {
        const match = text.match(/(\d+(?:[,.\s]\d+)*)/);
        if (match) {
          stats.followers = parseInt(match[1].replace(/[,.\s]/g, ''));
        }
      }
      else if (text.includes('suivi') || text.includes('following')) {
        const match = text.match(/(\d+(?:[,.\s]\d+)*)/);
        if (match) {
          stats.following = parseInt(match[1].replace(/[,.\s]/g, ''));
        }
      }
      else if (text.includes('publications') || text.includes('posts')) {
        const match = text.match(/(\d+(?:[,.\s]\d+)*)/);
        if (match) {
          stats.posts = parseInt(match[1].replace(/[,.\s]/g, ''));
        }
      }
    }
  });
  
  console.log("📊 Profile stats:", stats);
  return stats;
}

// ===================================================================
// === EXTRACTION POSTS - AUTONOME ET ROBUSTE ===
// ===================================================================
function getAllProfilePosts() {
  console.log("🔍 Extracting all profile posts from grid - STANDALONE VERSION");
  
  try {
    const posts = [];
    
    // Trouver TOUS les liens vers les posts
    const postLinks = [...document.querySelectorAll('a[href*="/p/"]')];
    console.log(`📊 Found ${postLinks.length} post links on the page`);
    
    if (postLinks.length === 0) {
      console.log("❌ No post links found at all");
      return [];
    }
    
    // Pour chaque lien de post, extraire le contenu
    postLinks.forEach((link, index) => {
      const href = link.href;
      let content = null;
      let extractionMethod = 'unknown';
      
      // Méthode 1: Texte alt de l'image
      const img = link.querySelector('img');
      if (img && img.alt) {
        const altText = img.alt.trim();
        console.log(`📝 Post ${index + 1} - Alt text: "${altText.substring(0, 50)}..."`);
        
        // Filtres permissifs
        if (altText.length > 5 && 
            !altText.match(/^(Photo de profil|Profile photo|Photo)$/i) &&
            !altText.match(/^[0-9\s,]+$/)) {
          
          content = altText;
          extractionMethod = 'alt_text';
          console.log(`✅ Post ${index + 1} accepted via alt text`);
        } else {
          console.log(`⏭️ Post ${index + 1} alt text filtered out`);
        }
      }
      
      // Méthode 2: Contenu basé sur l'URL si pas d'alt text
      if (!content) {
        const postIdMatch = href.match(/\/p\/([^\/\?]+)/);
        const postId = postIdMatch ? postIdMatch[1] : `post_${index + 1}`;
        
        content = `Instagram Post ${postId}`;
        extractionMethod = 'url_based';
        console.log(`🔗 Post ${index + 1} using URL-based content: ${content}`);
      }
      
      // Ajouter le post
      if (content) {
        posts.push({
          content: content,
          url: href,
          index: index + 1,
          type: extractionMethod,
          postId: href.match(/\/p\/([^\/\?]+)/)?.[1] || null
        });
        
        console.log(`📝 Post ${index + 1} added: "${content.substring(0, 50)}..." (${extractionMethod})`);
      }
    });
    
    console.log(`✅ Successfully extracted ${posts.length} posts from ${postLinks.length} links`);
    return posts;
    
  } catch (error) {
    console.error("❌ Error extracting posts:", error);
    return []; // TOUJOURS retourner un tableau, jamais null
  }
}

// ===================================================================
// === FONCTION DE DEBUG POUR ANALYSER LA PAGE ===
// ===================================================================
function debugPageStructure() {
  console.log("🔧 DEBUG: Analyzing Instagram page structure...");
  
  const postLinks = document.querySelectorAll('a[href*="/p/"]');
  console.log(`📊 Post links found: ${postLinks.length}`);
  
  if (postLinks.length > 0) {
    console.log("🔍 First few post links:");
    [...postLinks].slice(0, 3).forEach((link, i) => {
      const img = link.querySelector('img');
      const alt = img?.alt || '(no alt)';
      console.log(`  Post ${i + 1}: ${link.href} - Alt: "${alt.substring(0, 50)}..."`);
    });
  }
  
  const images = document.querySelectorAll('img[alt]');
  console.log(`🖼️ Images with alt: ${images.length}`);
  
  if (images.length > 0) {
    console.log("🔍 Sample image alt texts:");
    [...images].slice(0, 5).forEach((img, i) => {
      const alt = img.alt;
      if (alt && alt.length > 10) {
        console.log(`  Image ${i + 1}: "${alt.substring(0, 50)}..."`);
      }
    });
  }
  
  const articles = document.querySelectorAll('article');
  console.log(`📄 Articles found: ${articles.length}`);
  
  const main = document.querySelector('main');
  if (main) {
    const mainPostLinks = main.querySelectorAll('a[href*="/p/"]');
    console.log(`🎯 Post links in main: ${mainPostLinks.length}`);
  }
  
  // Déterminer le type de page
  if (window.location.href.includes('/p/')) {
    console.log("📍 Currently on individual post page");
  } else if (window.location.pathname.match(/^\/[^\/]+\/?$/)) {
    console.log("📍 Currently on profile page");
  } else {
    console.log("📍 Unknown page type:", window.location.pathname);
  }
  
  return {
    postLinks: postLinks.length,
    images: images.length,
    articles: articles.length,
    pageType: window.location.href.includes('/p/') ? 'post' : 'profile'
  };
}

// ===================================================================
// === ORCHESTRATEUR PRINCIPAL - EXTRACTION COMPLÈTE ===
// ===================================================================
function getFullProfileData() {
  console.log("🎯 Orchestrating full Instagram profile extraction - ALL-IN-ONE...");
  
  try {
    console.log("🔄 Step 1: Extracting bio...");
    const bio = getInstagramBio();
    console.log("📊 Bio result:", bio ? 'Found' : 'Not found');
    
    console.log("🔄 Step 2: Extracting posts...");
    const posts = getAllProfilePosts();
    console.log("📊 Posts result:", posts, "Type:", typeof posts, "IsArray:", Array.isArray(posts));
    
    console.log("🔄 Step 3: Extracting username...");
    const username = getProfileUsername();
    console.log("📊 Username result:", username);
    
    console.log("🔄 Step 4: Extracting stats...");
    const stats = getProfileStats();
    console.log("📊 Stats result:", stats);
    
    const profileData = {
      bio: bio,
      posts: posts || [], // S'assurer qu'on a toujours un tableau
      username: username,
      ...stats,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
    
    console.log("📊 Final profileData before return:", profileData);
    
    console.log("📊 Full profile extraction summary:", {
      username: profileData.username,
      bio: profileData.bio ? 'Found' : 'Not found',
      postsFound: (profileData.posts || []).length,
      followers: profileData.followers
    });

    return profileData;
  } catch (error) {
    console.error("❌ Error in getFullProfileData:", error);
    return {
      bio: null,
      posts: [],
      username: null,
      followers: null,
      following: null,
      postsCount: null,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

// ===================================================================
// === FONCTION AVEC ATTENTE ET RETRY ===
// ===================================================================
function waitForProfileData(maxMs = 5000) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    let attempts = 0;
    const maxAttempts = 10;
    
    function check() {
      attempts++;
      console.log(`🔄 Extraction attempt ${attempts}/${maxAttempts}...`);
      
      try {
        const data = getFullProfileData();
        
        // Considérer comme succès si on a au moins la bio OU des posts OU le username
        if (data.bio || (data.posts && data.posts.length > 0) || data.username) {
          console.log("✅ Profile data extraction successful");
          resolve(data);
          return;
        }
        
        // Timeout atteint
        if (performance.now() - start > maxMs) {
          console.log("⏰ Timeout reached, returning partial data");
          resolve(data);
          return;
        }
        
        // Trop de tentatives
        if (attempts >= maxAttempts) {
          console.log("🔄 Max attempts reached, returning partial data");
          resolve(data);
          return;
        }
        
        // Continuer à essayer
        setTimeout(check, 500);
        
      } catch (error) {
        console.error("❌ Error during profile data extraction:", error);
        resolve({
          bio: null,
          posts: [],
          username: null,
          followers: null,
          following: null,
          postsCount: null,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    }
    
    check();
  });
}

// ===================================================================
// === GESTIONNAIRE DE MESSAGES CHROME ===
// ===================================================================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("📨 Content script received message:", msg);
  
  if (msg.action === "getBio") {
    console.log("🎯 Getting Instagram bio only...");
    try {
      const bio = getInstagramBio();
      console.log("📤 Sending bio:", bio);
      sendResponse({ bio: bio });
    } catch (error) {
      console.error("❌ Error getting bio:", error);
      sendResponse({ bio: null, error: error.message });
    }
    return false; // Synchronous response
  }
  
  if (msg.action === "getFullProfile") {
    console.log("🎯 Getting full Instagram profile...");
    const debugInfo = debugPageStructure();
    
    waitForProfileData()
      .then(profileData => {
        console.log("📤 Sending full profile data:", profileData);
        profileData.debug = debugInfo;
        sendResponse(profileData);
      })
      .catch(error => {
        console.error("❌ Error getting full profile:", error);
        sendResponse({
          bio: null,
          posts: [],
          username: null,
          error: error.message,
          debug: debugInfo
        });
      });
    
    return true; // Asynchronous response
  }
  
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
            postsCount: profileData.posts?.length || profileData.postsCount || 0
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
    
    return true; // Asynchronous response
  }
  
  if (msg.action === "debug") {
    console.log("🔧 Running debug analysis...");
    const debugInfo = debugPageStructure();
    sendResponse({ debug: debugInfo });
    return false; // Synchronous response
  }
  
  console.log("⚠️ Unknown action:", msg.action);
  sendResponse({ error: "Unknown action: " + msg.action });
  return false;
});

console.log("✅ CSC Extension Content Script - ALL-IN-ONE VERSION - Ready!");
