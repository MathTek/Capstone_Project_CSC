// === EXTRACTION INFORMATIONS DU PROFIL INSTAGRAM ===

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

function getProfileStats() {
  console.log("🔍 Extracting profile statistics...");
  
  const stats = {
    followers: null,
    following: null,
    posts: null
  };

  // Sélecteurs pour les statistiques
  const statsSelectors = [
    'header section ul li',
    'header section > div a',
    'header section div[class*="stats"]',
    'header section span'
  ];

  const statsElements = [];
  statsSelectors.forEach(selector => {
    const elements = [...document.querySelectorAll(selector)];
    statsElements.push(...elements);
  });

  statsElements.forEach(el => {
    const text = el.innerText?.toLowerCase();
    if (text) {
      // Recherche followers/abonnés
      if (text.includes('abonnés') || text.includes('followers')) {
        const match = text.match(/(\d+(?:[,.\s]\d+)*)/);
        if (match) {
          const number = match[1].replace(/[,.\s]/g, '');
          stats.followers = parseInt(number);
        }
      }
      // Recherche following/abonnements
      else if (text.includes('suivi') || text.includes('following') || text.includes('abonnement')) {
        const match = text.match(/(\d+(?:[,.\s]\d+)*)/);
        if (match) {
          const number = match[1].replace(/[,.\s]/g, '');
          stats.following = parseInt(number);
        }
      }
      // Recherche posts/publications
      else if (text.includes('publications') || text.includes('posts')) {
        const match = text.match(/(\d+(?:[,.\s]\d+)*)/);
        if (match) {
          const number = match[1].replace(/[,.\s]/g, '');
          stats.posts = parseInt(number);
        }
      }
    }
  });

  console.log("📊 Profile stats found:", stats);
  return stats;
}

function getProfileMetadata() {
  console.log("🔍 Extracting profile metadata...");
  
  const metadata = {
    username: getProfileUsername(),
    stats: getProfileStats(),
    url: window.location.href,
    timestamp: new Date().toISOString(),
    isVerified: false,
    isPrivate: false
  };

  // Vérifier si le profil est vérifié
  const verifiedIcon = document.querySelector('[aria-label*="Vérifié"], [aria-label*="Verified"], svg[aria-label*="Vérifié"]');
  if (verifiedIcon) {
    metadata.isVerified = true;
    console.log("✅ Profile is verified");
  }

  // Vérifier si le profil est privé
  const privateIndicator = document.querySelector('[aria-label*="privé"], [aria-label*="private"]');
  if (privateIndicator || document.body.innerText.includes('Ce compte est privé')) {
    metadata.isPrivate = true;
    console.log("🔒 Profile is private");
  }

  console.log("📋 Profile metadata:", metadata);
  return metadata;
}

function waitForProfileInfo(maxMs = 3000) {
  return new Promise((resolve) => {
    const start = performance.now();
    
    function check() {
      const metadata = getProfileMetadata();
      
      // Considérer comme succès si on a au moins le nom d'utilisateur
      if (metadata.username) {
        resolve(metadata);
        return;
      }
      
      if (performance.now() - start > maxMs) {
        console.log("⏰ Timeout reached for profile info");
        resolve(metadata); // Retourner ce qu'on a trouvé
        return;
      }
      
      requestAnimationFrame(check);
    }
    
    check();
  });
}

// Export des fonctions pour utilisation dans content.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getProfileUsername,
    getProfileStats,
    getProfileMetadata,
    waitForProfileInfo
  };
}
