
// === EXTRACTION CONTENU D'UN POST INDIVIDUEL ===
function getInstaPostContent() {
  console.log("🔍 Extracting individual post content...");
  
  // Sélecteurs pour le contenu des posts Instagram
  const postContentSelectors = [
    'article div[data-testid="post-text"]', // Nouveau format Instagram
    'article span[dir="auto"]', // Texte du post
    'article div[role="button"] span', // Contenu cliquable
    '.Caption span', // Ancien format de caption
    'article div[class*="caption"] span', // Caption avec classe dynamique
    '[data-testid="post-caption"] span', // Test ID pour caption
    'article div:nth-of-type(3) span' // Sélecteur de position
  ];

  // Chercher le contenu principal du post
  const candidates = [];
  
  postContentSelectors.forEach(selector => {
    const elements = [...document.querySelectorAll(selector)];
    elements.forEach(el => {
      if (el.offsetParent !== null) { // Élément visible
        const text = el.innerText?.trim();
        if (text && text.length > 5) {
          candidates.push({
            text: text,
            length: text.length,
            element: el,
            selector: selector
          });
        }
      }
    });
  });

  // Filtrer les candidats pour éviter les éléments indésirables
  const filteredCandidates = candidates.filter(candidate => {
    const text = candidate.text.toLowerCase();
    return !text.match(/^(j'aime|like|comment|share|partager|voir plus|voir moins|il y a|ago|\d+\s*(h|min|j|d))$/i) &&
           !text.match(/^\d+$/) && // Éviter les nombres seuls
           !text.match(/^@\w+$/) && // Éviter les mentions seules
           text.length > 10; // Minimum de texte substantiel
  });

  // Trier par longueur et prendre le plus long
  const postContent = filteredCandidates
    .sort((a, b) => b.length - a.length)[0];

  const result = postContent ? postContent.text : null;
  console.log("📝 Individual post content:", result?.substring(0, 100) + "...");
  return result;
}

// === EXTRACTION POSTS DE LA GRILLE DU PROFIL ===
function getAllProfilePosts() {
  console.log("🔍 Extracting all profile posts from grid...");
  
  const posts = [];
  
  // Récupérer les posts de la grille du profil
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
      
      console.log(`📝 Profile post ${index + 1} found:`, altText.substring(0, 50) + '...');
    }
  });    console.log(`✅ Found ${posts.length} posts in profile grid`);
    return posts;
}

function getInstaPostMetadata() {
  const metadata = {
    likes: null,
    comments: null,
    shares: null,
    author: null,
    timestamp: null,
    hashtags: [],
    mentions: []
  };

  // Extraire le nom d'utilisateur
  const authorElement = document.querySelector('article header a[role="link"]');
  if (authorElement) {
    metadata.author = authorElement.innerText?.trim();
  }

  // Extraire les likes (approximatif)
  const likesElement = document.querySelector('article section button span[aria-label*="like"], article section span[aria-label*="j\'aime"]');
  if (likesElement) {
    const likesText = likesElement.getAttribute('aria-label') || likesElement.innerText;
    const likesMatch = likesText.match(/(\d+)/);
    if (likesMatch) {
      metadata.likes = parseInt(likesMatch[1]);
    }
  }

  // Extraire les commentaires
  const commentsElement = document.querySelector('article section button span[aria-label*="comment"], article section span[aria-label*="commentaire"]');
  if (commentsElement) {
    const commentsText = commentsElement.getAttribute('aria-label') || commentsElement.innerText;
    const commentsMatch = commentsText.match(/(\d+)/);
    if (commentsMatch) {
      metadata.comments = parseInt(commentsMatch[1]);
    }
  }

  return metadata;
}

function waitForPost(maxMs = 3000) {
  return new Promise((resolve) => {
    const start = performance.now();
    
    function check() {
      const postContent = getInstaPostContent();
      const metadata = getInstaPostMetadata();
      
      if (postContent) {
        resolve({
          content: postContent,
          metadata: metadata,
          url: window.location.href
        });
        return;
      }
      
      if (performance.now() - start > maxMs) {
        resolve({
          content: null,
          metadata: metadata,
          url: window.location.href,
          error: "Timeout: Post content not found"
        });
        return;
      }
      
      requestAnimationFrame(check);
    }
    
    check();
  });
}

// === FONCTION D'ATTENTE POUR POSTS ===
function waitForPosts(maxMs = 3000) {
  return new Promise((resolve) => {
    const start = performance.now();
    
    function check() {
      // Si on est sur un post individuel
      if (window.location.href.includes('/p/')) {
        const postContent = getInstaPostContent();
        const metadata = getInstaPostMetadata();
        
        if (postContent) {
          resolve({
            content: postContent,
            metadata: metadata,
            url: window.location.href,
            type: 'individual_post'
          });
          return;
        }
      } else {
        // Si on est sur un profil, récupérer tous les posts
        const profilePosts = getAllProfilePosts();
        if (profilePosts.length > 0) {
          resolve({
            posts: profilePosts,
            count: profilePosts.length,
            type: 'profile_posts'
          });
          return;
        }
      }
      
      if (performance.now() - start > maxMs) {
        resolve({
          content: null,
          posts: [],
          error: "Timeout: Posts not found"
        });
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
    getInstaPostContent,
    getAllProfilePosts,
    getInstaPostMetadata,
    waitForPosts
  };
}

// Les fonctions sont utilisées directement depuis content.js
console.log("📋 PostAnalyse module loaded");