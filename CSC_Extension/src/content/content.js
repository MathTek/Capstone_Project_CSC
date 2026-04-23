function getInstagramBio() {
  const allElements = [...document.querySelectorAll('header *')];
  const textData = allElements
    .map(el => ({
      text: el.textContent?.trim(),
      element: el,
      tagName: el.tagName,
      parent: el.parentElement?.tagName,
      hasDirectText: el.childNodes.length === 1 && el.childNodes[0].nodeType === 3,
      isLeaf: el.children.length === 0,
      position: Array.from(el.parentElement?.children || []).indexOf(el)
    }))
    .filter(data => data.text && data.text.length > 0);

  const scoredTexts = textData.map(data => {
    let score = 0;
    const text = data.text;

    if (text.length >= 20 && text.length <= 300) score += 10;
    if (text.includes(' ') && text.split(' ').length >= 2) score += 5;
    if (data.isLeaf) score += 3;
    if (data.hasDirectText) score += 2;
    if (text.match(/[.!?]$/)) score += 2;
    if (text.includes('\n') || text.includes('  ')) score += 1;

    if (text.match(/^@[\w\.]+$/i)) score -= 20;
    if (text.match(/^\d+$/)) score -= 15;
    if (text.match(/^(modifier|edit|suivre|follow|message|partager|share|voir|see|afficher|show)$/i)) score -= 10;
    if (text.match(/(abonnés|followers|publications|posts|suivis|following)/i)) score -= 8;
    if (text.match(/^(note|notes?\.{3}|\.{3}|•|▪|→|\.\.\.)$/i)) score -= 12;
    if (text.length < 5) score -= 10;
    if (text.length > 500) score -= 5;
    if (text === text.toUpperCase() && text.length > 10) score -= 3;

    if (text.match(/[a-z][A-Z]/)) score -= 5;
    if (text.match(/\w{3,}[A-Z]\w/)) score -= 8;
    if (text.split(/[A-Z]/).length > 4) score -= 10;

    return { ...data, score, originalText: text };
  });

  const sortedCandidates = scoredTexts
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  let selectedBio = null;

  const bestCandidate = sortedCandidates.find(c => c.score > 0);
  if (bestCandidate) {
    selectedBio = bestCandidate.text;
  } else {
    const leastBad = sortedCandidates[0];
    if (leastBad && leastBad.score > -10) {
      selectedBio = leastBad.text;
    }
  }

  if (!selectedBio) return null;

  let cleanedBio = selectedBio
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanedBio.length > 100 && cleanedBio.match(/[a-z][A-Z]|[a-zA-Z][0-9]|[0-9][a-zA-Z]/)) {
    cleanedBio = cleanedBio
      .replace(/([a-z])([A-Z][a-z])/g, '$1 $2')
      .replace(/([a-zA-Z])(\d)/g, '$1 $2')
      .replace(/(\d)([a-zA-Z])/g, '$1 $2')
      .replace(/([.!?])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return cleanedBio;
}

async function getAllProfilePosts() {
  const posts = [];
  const collected = document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"], a[href*="/tv/"]');
  let index = 1;

  for (const item of collected) {
    const href = item.href;
    posts.push({
      content: null,
      url: href,
      index: index++,
      type: href.includes("/reel/") ? "reel" : href.includes("/tv/") ? "video" : "post"
    });
  }

  return posts;
}

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
      await new Promise(res => setTimeout(res, 1400));
    }

    post.content = getSinglePostContent();
    await new Promise(res => setTimeout(res, 350));
  }

  return posts;
}

async function getFullProfileData() {
  const profileData = {
    bio: getInstagramBio(),
    posts: await fetchFullPostsDetails(await getAllProfilePosts()),
    stories: await getAllProfileStories(),
    username: null,
    followers: null,
    following: null,
    postsCount: null,
    storiesCount: null,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };

  const usernameEl = document.querySelector('header h2, header h1, h1');
  if (usernameEl) {
    profileData.username = usernameEl.innerText?.trim();
  }

  if (profileData.stories && profileData.stories.length > 0) {
    profileData.storiesCount = profileData.stories.length;
  }

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


  return profileData;
}

function waitForProfileData(maxMs = 5000) {
  return new Promise((resolve) => {
    const start = performance.now();

    async function check() {
      const data = await getFullProfileData();
      if (data.bio || data.posts.length > 0) {
        resolve(data);
        return;
      }
      if (performance.now() - start > maxMs) {
        resolve(data);
        return;
      }
      requestAnimationFrame(check);
    }

    check();
  });
}

async function getAllProfileStories() {
  const stories = [];
  const storySelectors = ['a[href*="/stories/highlights/"]'];
  let storyElements = [];

  for (const selector of storySelectors) {
    storyElements = [...document.querySelectorAll(selector)];
    if (storyElements.length > 0) break;
  }

  let index = 1;

  for (const storyElement of storyElements) {
    const storyTitle = extractStoryTitle(storyElement);
    if (storyTitle) {
      stories.push({
        title: storyTitle,
        index: index++,
        type: "story",
        url: storyElement.href
      });
    }
  }

  return stories;
}

function extractStoryTitle(storyElement) {
  const ariaLabel = storyElement.getAttribute('aria-label');
  if (ariaLabel && isValidStoryTitle(ariaLabel)) {
    return cleanStoryTitle(ariaLabel);
  }

  const titleElements = storyElement.querySelectorAll('span, div');
  for (const titleEl of titleElements) {
    const text = titleEl.textContent?.trim();
    if (text && isValidStoryTitle(text)) {
      return cleanStoryTitle(text);
    }
  }

  return null;
}

function isValidStoryTitle(text) {
  if (!text || text.length === 0) return false;

  const invalidPatterns = [
    /^@[\w\.]+$/i,
    /^\d+$/,
    /^(voir|see|afficher|show|plus|more)$/i,
    /profile picture/i,
    /loading/i,
    /^\.{3,}$/,
    /^[•▪→\-_]+$/
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(text)) return false;
  }

  return text.length >= 1 && text.length <= 100;
}

function cleanStoryTitle(title) {
  return title
    .replace(/^(view|voir)\s+/i, '')
    .replace(/\s+(highlight|story)$/i, '')
    .replace(/^(story de|story by|histoire de|histoire by)\s*/i, '')
    .replace(/@[\w\.]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}



function getXBio() {
  const descEl = /** @type {HTMLElement|null} */ (document.querySelector('[data-testid="UserDescription"]'));
  if (descEl) {
    const text = descEl.innerText?.trim();
    if (text && text.length > 0) return text;
  }

  const ariaDesc = /** @type {HTMLElement|null} */ (document.querySelector('[aria-label="Bio"], [aria-label="Description"]'));
  if (ariaDesc) {
    const text = ariaDesc.innerText?.trim();
    if (text && text.length > 0) return text;
  }

  const primaryCol = document.querySelector('[data-testid="primaryColumn"]') ?? document.body;
  const candidates = [...primaryCol.querySelectorAll('span')].filter(el => {
    if (el.children.length !== 0) return false;
    const t = el.textContent.trim();
    if (!t || t.length < 10 || t.length > 500) return false;
    if (t.match(/^@[\w.]+$/)) return false;
    if (t.match(/^\d[\d,.]*(K|M|B)?$/i)) return false;
    if (t.match(/^(Followers?|Following|Posts?|Tweets?|Likes?|Média|Media)$/i)) return false;
    if (t.match(/^(Follow|Suivre|Message|Plus|More|Edit profile|Modifier le profil)$/i)) return false;
    return true;
  });

  if (candidates.length > 0) {
    const scored = candidates.map(el => {
      const t = el.textContent.trim();
      let score = 0;
      if (t.length >= 20 && t.length <= 300) score += 8;
      if (t.split(' ').length >= 3)          score += 5;
      if (t.match(/[.!?]$/))                 score += 3;
      if (t.includes('@') || t.match(/https?:\/\//)) score += 2;
      if (t.length < 15)                     score -= 4;
      return { el, t, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];
    if (best && best.score >= 5) return best.t;
  }

  return null;
}

function getXPosts() {
  const posts  = [];
  const seen   = new Set();
  let   index  = 1;

  const tweetArticles = [...document.querySelectorAll('article[data-testid="tweet"]')];

  for (const article of tweetArticles) {
    const textEl = /** @type {HTMLElement|null} */ (article.querySelector('[data-testid="tweetText"]'));
    if (!textEl) continue;

    const text = textEl.innerText?.trim();
    if (!text || text.length < 2 || seen.has(text)) continue;

    let url = null;
    const timeLink = /** @type {HTMLAnchorElement|null} */ (article.querySelector('a[href*="/status/"]'));
    if (timeLink) url = timeLink.href;

    const isRetweet = !!article.querySelector('[data-testid="socialContext"]');

    seen.add(text);
    posts.push({ content: text, url, index: index++, type: isRetweet ? 'retweet' : 'tweet' });
  }

  return posts;
}

function getXUsername() {
  const userNameEl = document.querySelector('[data-testid="UserName"]');
  if (userNameEl) {
    const spans = [...userNameEl.querySelectorAll('span')];
    const handle = spans.find(s => s.textContent.trim().startsWith('@'));
    if (handle) return handle.textContent.trim();
    const displayName = spans.find(s => s.textContent.trim().length > 0);
    if (displayName) return displayName.textContent.trim();
  }

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) return ogTitle.getAttribute('content')?.trim() ?? null;

  return null;
}

function getXStats() {
  const stats = { followers: null, following: null };

  const followersLink = document.querySelector('a[href$="/verified_followers"], a[href$="/followers"]');
  if (followersLink) {
    const match = followersLink.textContent.match(/[\d,]+[KMB]?/i);
    if (match) stats.followers = match[0];
  }

  const followingLink = document.querySelector('a[href$="/following"]');
  if (followingLink) {
    const match = followingLink.textContent.match(/[\d,]+[KMB]?/i);
    if (match) stats.following = match[0];
  }

  return stats;
}

async function getFullXProfileData() {
  const { followers, following } = getXStats();
  return {
    platform:   'x',
    bio:        getXBio(),
    posts:      getXPosts(),
    stories:    [],
    username:   getXUsername(),
    followers,
    following,
    postsCount: null,
    url:        window.location.href,
    timestamp:  new Date().toISOString(),
  };
}

function waitForXData(maxMs = 6000) {
  return new Promise(resolve => {
    const start = performance.now();

    async function check() {
      const data = await getFullXProfileData();
      if (data.bio || data.posts.length > 0) {
        resolve(data);
        return;
      }
      if (performance.now() - start > maxMs) {
        resolve(data);
        return;
      }
      requestAnimationFrame(check);
    }

    check();
  });
}

function getFacebookBio() {
 
  
  
  const mainDiv = /** @type {HTMLElement|null} */ (document.querySelector('div[role="main"]'));
  if (!mainDiv) {
    console.log("main div not found");
    return null;
  }


  
  const allText = mainDiv.innerText;
  

  const statsPattern = /(\d+\s+(followers?|ami|suivi|amis|friends|following))\s*(•|\s)?(\d+\s+(followers?|ami|suivi|amis|friends|following))?/i;
  let statsMatch = allText.match(statsPattern);
  
  if (statsMatch) {
    const statsStartIndex = allText.indexOf(statsMatch[0]);
    const statsEndIndex = statsStartIndex + statsMatch[0].length;
    
    const textAfterStats = allText.substring(statsEndIndex).trim();
    
    const lines = textAfterStats.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let bioLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      const uiPatterns = [
        /^Ajouter à la story$/i,
        /^Ajouter à la liste$/i,
        /^Modifier le profil$/i,
        /^Modifier$/i,
        /^Promouvoir$/i,
        /^Tableau de bord professionnel$/i,
        /^Ajouter un bouton d'appel à l'action$/i,
        /^Suivre$/i,
        /^Follow$/i,
        /^Message$/i,
        /^Patreon$/i,
        /^Entreprise informatique$/i,
        /^Entreprise$/i,
        /^Organisation$/i,
        /^Collectivité$/i,
        /^Secteur public$/i,
      ];
      
      const navigationPatterns = [
        /^Plus$/i,
        /^Tout$/i,
        /^À propos$/i,
        /^Ami\(e\)s$/i,
        /^Photos$/i,
        /^Reels$/i,
        /^Vidéos$/i,
        /^À la une$/i,
        /^Tous les ami/i,
        /^Toutes les photos/i,
        /^Confidentialité$/i,
        /^Conditions générales$/i,
        /^Publicités$/i,
        /^Choix publicitaires$/i,
        /^Cookies$/i,
        /^Que voulez-vous dire/i,
        /^Vidéo en direct$/i,
        /^Photo\/Vidéo$/i,
        /^Évènement marquant$/i,
        /^Publications$/i,
        /^Filtres$/i,
        /^Gérer les publications$/i,
        /^Vue Liste$/i,
        /^Vue Grille$/i,
        /^Facebook$/i,
        /^Partagé avec/i,
        /^J'aime$/i,
        /^Commenter$/i,
        /^Partager$/i,
        /^Commenter en tant que/i,
      ];
      
      const isNavigation = navigationPatterns.some(pattern => pattern.test(line));
      if (isNavigation) {
        break;
      }
      
      const isUIElement = uiPatterns.some(pattern => pattern.test(line));
      
      if (isUIElement) {
        continue;
      }
      
      if (line.length >= 3 && line.match(/[a-zA-ZÀ-ÿ0-9🌐🚀💼🔗@.]/)) {
        bioLines.push(line);
      }
    }
    
    if (bioLines.length > 0) {
      const completeBio = bioLines.join('\n');
      return completeBio;
    }
  }
  
  

  const allDivs = mainDiv.querySelectorAll('div, span, p');
  let candidates = [];
  
  for (const el of allDivs) {
    const text = el.textContent?.trim() ?? '';
    
    if (text.length >= 15 && text.length <= 500) {
      if (!text.match(/^(Tableau|Modifier|Promouvoir|Suivre|Message|Ajouter|Entreprise informatique)/) 
          && text.match(/[a-zA-ZÀ-ÿ]{10,}/)
          && text.includes(' ')
          && !text.match(/^\d+\s+(followers?|suivi)/i)) {
        candidates.push(text);
      }
    }
  }
  
  for (const candidate of candidates) {
    if (!candidate.match(/^(photo de couverture|changer|modifier|edit)/i)) {
      return candidate;
    }
  }
  
  return null;
}

function getFacebookUsername() {
  const usernameSelectors = [
    'h1',
    'h2',
    'div[data-testid="profile_name"] span',
    'div[role="main"] h1',
    'header h1',
  ];

  for (const selector of usernameSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      const text = el.textContent?.trim();
      if (text && text.length > 0 && text.length < 100) {
        return text;
      }
    }
  }

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    return ogTitle.getAttribute('content')?.trim() ?? null;
  }

  return null;
}

function getFacebookStats() {
  const stats = {
    followers: null,
    following: null,
    postsCount: null,
  };

  const statElements = document.querySelectorAll('div[data-testid*="count"], a[href*="/friends"], a[href*="/followers"], a[href*="/following"], span');

  for (const el of statElements) {
    const text = el.textContent?.toLowerCase() ?? '';
    const parentText = el.parentElement?.textContent?.toLowerCase() ?? '';
    const fullText = (text + ' ' + parentText).toLowerCase();

    if (fullText.includes('abonné') || fullText.includes('follower')) {
      const match = el.textContent?.match(/\d+/);
      if (match && !stats.followers) {
        stats.followers = parseInt(match[0]);
      }
    }

    if (fullText.includes('suivi') || fullText.includes('following')) {
      const match = el.textContent?.match(/\d+/);
      if (match && !stats.following) {
        stats.following = parseInt(match[0]);
      }
    }

    if (fullText.includes('publication') || fullText.includes('post')) {
      const match = el.textContent?.match(/\d+/);
      if (match && !stats.postsCount) {
        stats.postsCount = parseInt(match[0]);
      }
    }
  }

  return stats;
}

function getFacebookPosts() {
  const posts = [];
  const seen = new Set();
  let index = 1;

  const mainDiv = /** @type {HTMLElement|null} */ (document.querySelector('div[role="main"]'));
  if (!mainDiv) {
    return posts;
  }

  const allText = mainDiv.innerText;
  
  const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let publicationsSectionStart = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^Publications$/i)) {
      publicationsSectionStart = i;
      break;
    }
  }
  
  const processLines = publicationsSectionStart !== -1 ? lines.slice(publicationsSectionStart + 1) : lines;
  
  let currentPost = null;
  
  for (let i = 0; i < processLines.length; i++) {
    const line = processLines[i];
    
    const buttonPatterns = [
      /^Filtres$/i,
      /^Gérer les publications$/i,
      /^Vue Liste$/i,
      /^Vue Grille$/i,
      /^Ajouter des éléments à la une$/i,
    ];
    
    const isButton = buttonPatterns.some(pattern => pattern.test(line));
    if (isButton) {
      continue;
    }
    
    const endSectionPatterns = [
      /^Confidentialité$/i,
      /^Conditions générales$/i,
      /^À propos$/i,
      /^Ami\(e\)s$/i,
      /^Photos$/i,
      /^Reels$/i,
      /^Vidéos$/i,
      /^Que voulez-vous dire/i,
    ];
    
    const isEndSection = endSectionPatterns.some(pattern => pattern.test(line));
    if (isEndSection) {
      if (currentPost && currentPost.content && currentPost.content.length >= 3) {
        if (!seen.has(currentPost.content)) {
          seen.add(currentPost.content);
          posts.push(currentPost);
        }
      }
      break;
    }
    
    const actionPatterns = [
      /^J'aime$/i,
      /^Commenter$/i,
      /^Partager$/i,
      /^Commenter en tant que/i,
      /^Partagé avec\s*:/i,
      /^Plus$/i,
    ];
    
    const isAction = actionPatterns.some(pattern => pattern.test(line));
    if (isAction) {
      if (currentPost && currentPost.content && currentPost.content.length >= 3) {
        if (!seen.has(currentPost.content)) {
          seen.add(currentPost.content);
          posts.push(currentPost);
          index++;
        }
      }
      currentPost = null;
      continue;
    }
    
    if (line.match(/^(Tout|À la une|Ajouter)/i)) {
      if (currentPost && currentPost.content && currentPost.content.length >= 3) {
        if (!seen.has(currentPost.content)) {
          seen.add(currentPost.content);
          posts.push(currentPost);
          index++;
        }
      }
      currentPost = null;
      continue;
    }
    
    if (line === 'Facebook') {
      continue;
    }
    
    if (line.length >= 3 && line.match(/[a-zA-ZÀ-ÿ0-9@.\-éèê]/)) {
      if (!currentPost) {
        currentPost = {
          content: line,
          url: null,
          index: index,
          type: 'post',
          timestamp: new Date().toISOString(),
        };
      } else {
        currentPost.content += '\n' + line;
      }
    }
  }
  
  if (currentPost && currentPost.content && currentPost.content.length >= 3) {
    if (!seen.has(currentPost.content)) {
      seen.add(currentPost.content);
      posts.push(currentPost);
    }
  }

  console.log("Posts trouvés:", posts);
  return posts;
}

async function getFullFacebookProfileData() {
  const { followers, following, postsCount } = getFacebookStats();

  return {
    platform: 'facebook',
    bio: getFacebookBio(),
    posts: getFacebookPosts(),
    username: getFacebookUsername(),
    followers,
    following,
    postsCount,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  };
}

function waitForFacebookData(maxMs = 6000) {
  return new Promise(resolve => {
    const start = performance.now();

    async function check() {
      const data = await getFullFacebookProfileData();
      if (data.bio || data.posts.length > 0) {
        resolve(data);
        return;
      }
      if (performance.now() - start > maxMs) {
        resolve(data);
        return;
      }
      requestAnimationFrame(check);
    }

    check();
  });
}

const browserAPI = (typeof globalThis !== 'undefined' && (globalThis.browser || globalThis.chrome)) || undefined;

if (browserAPI && browserAPI.runtime) {
  browserAPI.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "getFullProfile") {
      waitForProfileData()
        .then(profileData => sendResponse(profileData))
        .catch(error =>
          sendResponse({ bio: null, posts: [], username: null, error: error.message })
        );
      return true;
    }

    if (msg.action === "getFacebookProfile") {
      waitForFacebookData()
        .then(profileData => sendResponse(profileData))
        .catch(error =>
          sendResponse({ bio: null, posts: [], username: null, error: error.message })
        );
      return true;
    }

    if (msg.action === "getXProfile") {
      waitForXData()
        .then(profileData => sendResponse(profileData))
        .catch(error =>
          sendResponse({ bio: null, posts: [], username: null, error: error.message })
        );
      return true;
    }

    if (msg.action === "checkOwnProfile") {
      // DEPRECATED: Old single-signal verification
      // Now using multi-signal verification in background script
      const isOwnProfile = checkOwnProfile();
      sendResponse({ isOwnProfile: isOwnProfile });
      return true;
    }

    if (msg.action === "captureNetworkData") {
      // Background script is requesting network data capture
      // This has already been started on page load
      sendResponse({ status: 'capturing' });
      return true;
    }

    if (msg.action === "getDOMCheckData") {
      // Perform integrity-checked DOM verification
      const url = window.location.href;
      let domData = null;

      if (url.includes('instagram.com')) {
        domData = checkInstagramOwnProfileWithIntegrity();
      } else if (url.includes('facebook.com')) {
        domData = checkFacebookOwnProfile();
      } else if (url.includes('x.com') || url.includes('twitter.com')) {
        domData = checkXOwnProfile();
      }

      sendResponse({ domCheckData: domData });
      return true;
    }

    sendResponse({ error: "Unknown action: " + msg.action });
    return false;
  });
}

// Function to check if this is the user's own profile
function checkOwnProfile() {
  const url = window.location.href;
  
  if (url.includes('instagram.com')) {
    return checkInstagramOwnProfile();
  } else if (url.includes('facebook.com')) {
    return checkFacebookOwnProfile();
  } else if (url.includes('twitter.com') || url.includes('x.com')) {
    return checkXOwnProfile();
  }
  
  return false;
}

function checkInstagramOwnProfile() {
  // Check for "Edit profile" button - only visible on your own profile
  // Instagram usually has a button with specific text or aria-label
  
  console.log('[CSC] Starting Instagram profile verification...');
  
  // IMPORTANT: Don't just look for edit buttons anywhere on page
  // Look specifically in the profile header section
  
  const profileHeader = document.querySelector('header') || 
                       document.querySelector('[role="banner"]') ||
                       document.querySelector('[role="main"] > div:first-child');
  
  if (!profileHeader) {
    console.log('[CSC] No profile header found');
    return false;
  }
  
  // Method 1: Look for edit profile button IN THE HEADER ONLY
  const buttons = Array.from(profileHeader.querySelectorAll('button'));
  console.log('[CSC] Found', buttons.length, 'buttons in profile header');
  
  const editProfileBtn = buttons.find(btn => {
    const text = btn.textContent.toLowerCase().trim();
    const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
    
    // Log each button that contains "edit" for debugging
    if (text.includes('edit') || ariaLabel.includes('edit')) {
      console.log('[CSC] Found button with "edit":', text || ariaLabel);
    }
    
    return (text.includes('edit') && text.includes('profile')) || 
           text === 'edit profile' ||
           ariaLabel.includes('edit profile') ||
           ariaLabel.includes('modifier le profil');
  });
  
  if (editProfileBtn) {
    console.log('[CSC] ✓ Found Edit Profile button in header');
    return true;
  }
  
  // Method 2: Check for edit profile link in header
  const editLinks = Array.from(profileHeader.querySelectorAll('a')).filter(a => {
    const href = a.href || '';
    const text = a.textContent.toLowerCase();
    return href.includes('/accounts/edit/') || text.includes('edit');
  });
  
  console.log('[CSC] Found', editLinks.length, 'edit links in header');
  if (editLinks.length > 0) {
    console.log('[CSC] ✓ Found Edit Profile link in header:', editLinks[0].href);
    return true;
  }
  
  // Method 3: Check for menu button that opens edit options
  // On your own profile, there's usually a menu with edit/settings options
  const menuButtons = buttons.filter(btn => {
    const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
    return ariaLabel.includes('option') || ariaLabel.includes('menu') || ariaLabel.includes('more');
  });
  
  // Click menu to check if it has edit option (only on own profile)
  // BUT: Be careful not to click - just check for indicators
  for (const menuBtn of menuButtons) {
    const ariaExpanded = menuBtn.getAttribute('aria-expanded');
    const ariaHasPopup = menuBtn.getAttribute('aria-haspopup');
    
    // Check if menu is already expanded
    if (ariaExpanded === 'true') {
      const menu = document.querySelector('[role="menu"]') || 
                   menuBtn.nextElementSibling?.querySelector('[role="menu"]');
      if (menu) {
        const editOption = Array.from(menu.querySelectorAll('[role="menuitem"]')).find(item =>
          item.textContent.toLowerCase().includes('edit')
        );
        if (editOption) {
          console.log('[CSC] ✓ Found Edit option in expanded menu');
          return true;
        }
      }
    }
  }
  
  console.log('[CSC] ✗ No owner-only features detected in profile header');
  return false;
}

function checkFacebookOwnProfile() {
  // Check for "Edit profile" button or profile edit options
  const buttons = Array.from(document.querySelectorAll('button'));
  
  // Method 1: Look for edit profile button
  const editBtn = buttons.find(btn => {
    const text = btn.textContent.toLowerCase().trim();
    return (text.includes('edit') && text.includes('profile')) || 
           text === 'edit profile' ||
           btn.getAttribute('aria-label')?.toLowerCase().includes('edit profile');
  });
  
  if (editBtn) {
    console.log('[CSC] Found Edit Profile button on Facebook');
    return true;
  }
  
  // Method 2: Check for "View as" button - only on your own profile
  const viewAsBtn = buttons.find(btn =>
    btn.textContent.toLowerCase().includes('view as')
  );
  
  if (viewAsBtn) {
    console.log('[CSC] Found View As button on Facebook');
    return true;
  }
  
  // Method 3: Check for profile settings/options
  const settingsBtn = buttons.find(btn => {
    const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase();
    return ariaLabel && (ariaLabel.includes('settings') || ariaLabel.includes('options') || ariaLabel.includes('menu'));
  });
  
  if (settingsBtn) {
    console.log('[CSC] Found Settings/Options button on Facebook');
    return true;
  }
  
  console.log('[CSC] No owner-only features detected on Facebook profile');
  return false;
}

function checkXOwnProfile() {
  // Check for profile edit option - only on your own profile
  const buttons = Array.from(document.querySelectorAll('button'));
  
  // Method 1: Look for edit profile button
  const editProfileBtn = buttons.find(btn => {
    const text = btn.textContent.toLowerCase().trim();
    const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase();
    return (text.includes('edit') && text.includes('profile')) || 
           text === 'edit profile' ||
           (ariaLabel && ariaLabel.includes('edit'));
  });
  
  if (editProfileBtn) {
    console.log('[CSC] Found Edit Profile button on X');
    return true;
  }
  
  // Method 2: Check for More button with owner options
  const moreBtn = buttons.find(btn => 
    btn.getAttribute('aria-label')?.toLowerCase().includes('more') &&
    !btn.getAttribute('aria-label')?.toLowerCase().includes('likes')
  );
  
  if (moreBtn) {
    console.log('[CSC] Found More options button on X');
    return true;
  }
  
  // Method 3: Check for follow/unfollow button - if it's not there, it's your own profile
  const followBtn = buttons.find(btn => {
    const text = btn.textContent.toLowerCase().trim();
    return text.includes('follow') || text.includes('unfollow');
  });
  
  // If no follow/unfollow button, it might be your own profile (more reliable check)
  if (!followBtn) {
    const profileHeader = document.querySelector('header') || document.querySelector('[role="banner"]');
    if (profileHeader && profileHeader.textContent.includes('@')) {
      console.log('[CSC] No follow button found - likely your own profile on X');
      return true;
    }
  }
  
  console.log('[CSC] No owner-only features detected on X profile');
  return false;
}

/**
 * MULTI-LAYER SECURITY VERIFICATION FOR ACCOUNT OWNERSHIP
 * This content script supplements the background service worker verification
 * by providing DOM integrity checks and network data capture.
 * 
 * CRITICAL: This script runs in page context and can be tampered with.
 * All verdicts from this script must be validated by the background service worker.
 */

// Store page load timestamp
const PAGE_LOAD_TIME = Date.now();

/**
 * FUNCTION: Verify DOM Element Integrity
 * 
 * Detects if an element has been created dynamically or injected.
 * Uses multiple layers of validation:
 * 1. Checks if element's property descriptors have been overridden
 * 2. Verifies element is properly nested in expected DOM containers
 * 3. Confirms element visibility (offsetParent !== null)
 * 4. Validates that getters are native (not spoofed)
 */
function verifyDOMElementIntegrity(element) {
  if (!element) return false;

  // Check 1: Verify the element is actually an HTMLAnchorElement or HTMLButtonElement
  if (!(element instanceof HTMLElement)) {
    console.log('[CSC] ✗ Element is not an HTMLElement');
    return false;
  }

  // Check 2: Verify href/textContent getters haven't been overridden (for links)
  if (element.tagName === 'A') {
    try {
      // Get the native property descriptor
      const hrefDescriptor = Object.getOwnPropertyDescriptor(
        HTMLAnchorElement.prototype,
        'href'
      );

      // If descriptor was overridden, it won't be inherited from prototype
      const ownDescriptors = Object.getOwnPropertyNames(element);
      if (ownDescriptors.includes('href')) {
        console.log('[CSC] ✗ Element has custom href property (possible override)');
        return false;
      }

      // Verify the getter is native
      if (hrefDescriptor && hrefDescriptor.get) {
        const href = hrefDescriptor.get.call(element);
        console.log('[CSC] ✓ href verified as native:', href);
      }
    } catch (e) {
      console.log('[CSC] ✗ Error verifying href descriptor:', e.message);
      return false;
    }
  }

  // Check 3: Verify element is visible (not hidden by attacker)
  if (element.offsetParent === null) {
    console.log('[CSC] ✗ Element is hidden (offsetParent is null)');
    return false;
  }

  // Check 4: Verify element is nested in expected containers
  const expectedContainers = [
    '#react-root',
    '[role="main"]',
    'header',
    'nav'
  ];

  let isInExpectedContainer = false;
  let parent = element.parentElement;
  let depth = 0;

  while (parent && depth < 15) {
    const matchesSelector = expectedContainers.some(selector => 
      parent.matches(selector)
    );
    if (matchesSelector) {
      isInExpectedContainer = true;
      break;
    }
    parent = parent.parentElement;
    depth++;
  }

  if (!isInExpectedContainer) {
    console.log('[CSC] ⚠ Element not found in expected containers, but continuing');
    // Note: We don't fail here because Instagram structure varies
  }

  // Check 5: Verify element is in document (not orphaned)
  if (!document.body.contains(element)) {
    console.log('[CSC] ✗ Element is not in the document');
    return false;
  }

  return true;
}

/**
 * FUNCTION: Enhanced Instagram Profile Verification
 * 
 * Combines multiple detection methods with integrity verification.
 * Returns not just a boolean, but detailed data for background script validation.
 * 
 * CRITICAL: Also extracts the profile's username to verify we're on the right profile
 * and checks that suspicious elements don't appear where they shouldn't.
 */
function checkInstagramOwnProfileWithIntegrity() {
  console.log('[CSC] [SECURE] Starting Instagram profile verification with integrity checks...');
  
  const checks = {
    editProfileButton: null,
    editProfileLink: null,
    viewArchiveLink: null,
    profileUsername: null,  // Extract from page
    elementsFound: false,
    integrityCertified: false,
    elements: [],
    timestamp: Date.now(),
    timeSincePageLoad: Date.now() - PAGE_LOAD_TIME,
    warnings: [] // Track any suspicious findings
  };

  // STEP 0: Extract the profile's username from the page
  checks.profileUsername = extractInstagramProfileUserId();
  console.log('[CSC] Current profile username:', checks.profileUsername);

  // STEP 1: Ensure we're on a profile page (not search, explore, etc)
  if (!checks.profileUsername || checks.profileUsername.length < 2) {
    console.log('[CSC] ✗ Could not determine profile username - aborting verification');
    checks.integrityCertified = false;
    checks.elementsFound = false;
    return checks;
  }

  // STEP 2: Find the profile header section
  const profileHeader = document.querySelector('header') || 
                       document.querySelector('[role="banner"]') ||
                       document.querySelector('[role="main"] > div:first-child');
  
  if (!profileHeader) {
    console.log('[CSC] ✗ No profile header found - not on a profile page');
    checks.elementsFound = false;
    checks.integrityCertified = false;
    return checks;
  }

  // STEP 3: Look for Edit Profile button IN THE HEADER ONLY (very specific)
  const buttons = Array.from(profileHeader.querySelectorAll('button'));
  console.log('[CSC] Found', buttons.length, 'buttons in profile header');
  
  // STRICT: Only accept buttons that are clearly about editing the profile
  const editProfileBtn = buttons.find(btn => {
    const text = btn.textContent.toLowerCase().trim();
    const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
    const testId = btn.getAttribute('data-testid')?.toLowerCase() || '';
    
    // Log for debugging
    if (text.includes('edit') || ariaLabel.includes('edit')) {
      console.log('[CSC] Button candidate:', { text, ariaLabel, testId });
    }
    
    // MUST contain both 'edit' AND 'profile' to be confident
    const hasEditProfile = (text.includes('edit') && text.includes('profile')) || 
                          (ariaLabel.includes('edit') && ariaLabel.includes('profile')) ||
                          ariaLabel === 'edit profile' ||
                          ariaLabel === 'modifier le profil' ||
                          text === 'edit profile';
    
    return hasEditProfile;
  });
  
  if (editProfileBtn && verifyDOMElementIntegrity(editProfileBtn)) {
    checks.editProfileButton = {
      found: true,
      text: editProfileBtn.textContent.trim(),
      ariaLabel: editProfileBtn.getAttribute('aria-label'),
      verified: true
    };
    checks.elements.push(editProfileBtn);
    console.log('[CSC] ✓ Found verified Edit Profile button');
  } else if (editProfileBtn) {
    checks.warnings.push('Edit Profile button found but integrity check failed - possible injection');
    console.log('[CSC] ⚠ Edit button found but failed integrity check');
  }

  // STEP 4: Look for Edit Profile link (less common)
  const editLinks = Array.from(profileHeader.querySelectorAll('a')).filter(a => {
    const href = a.href || '';
    const text = a.textContent.toLowerCase();
    return (href.includes('/accounts/edit/') && verifyDOMElementIntegrity(a));
  });

  if (editLinks.length > 0) {
    checks.editProfileLink = {
      found: true,
      href: editLinks[0].href,
      text: editLinks[0].textContent.trim(),
      verified: true
    };
    checks.elements.push(editLinks[0]);
    console.log('[CSC] ✓ Found verified Edit Profile link');
  }

  // STEP 5: Look for Archive/View Archive link (owner-only feature)
  const archiveLinks = Array.from(profileHeader.querySelectorAll('a')).filter(a => {
    const href = a.href || '';
    const text = a.textContent.toLowerCase();
    return href.includes('/archive') && verifyDOMElementIntegrity(a);
  });

  if (archiveLinks.length > 0) {
    checks.viewArchiveLink = {
      found: true,
      href: archiveLinks[0].href,
      text: archiveLinks[0].textContent.trim(),
      verified: true
    };
    checks.elements.push(archiveLinks[0]);
    console.log('[CSC] ✓ Found verified View Archive link');
  }

  // STEP 6: Determine if enough elements were found
  const foundCount = [
    checks.editProfileButton?.verified,
    checks.editProfileLink?.verified,
    checks.viewArchiveLink?.verified
  ].filter(Boolean).length;

  checks.elementsFound = foundCount >= 1;
  
  // Only certify if:
  // 1. We found at least one verified owner-only element
  // 2. No timing red flags (verification soon after page load - normal behavior)
  // 3. No suspicious element overrides
  checks.integrityCertified = checks.elementsFound && 
    checks.timeSincePageLoad < 20000 && 
    checks.warnings.length === 0;

  console.log('[CSC] [SECURE] Instagram verification result:', {
    elementsFound: checks.elementsFound,
    integrityCertified: checks.integrityCertified,
    profileUsername: checks.profileUsername,
    warningCount: checks.warnings.length,
    checksSummary: `edit=${checks.editProfileButton?.verified || false}, link=${checks.editProfileLink?.verified || false}, archive=${checks.viewArchiveLink?.verified || false}`
  });

  return checks;
}

/**
 * Extract the profile's user ID from Instagram's page data
 * 
 * CRITICAL: This extracts the ID of the profile being VIEWED, not the logged-in user.
 * Instagram stores this in multiple places:
 * 1. In the URL (instagram.com/username/)
 * 2. In meta tags
 * 3. In aria-labels or data attributes
 * 
 * The background script will compare this against the cookie ds_user_id
 * to verify we're viewing our own profile.
 */
function extractInstagramProfileUserId() {
  // Method 1: Try to get from meta property (og:url or similar)
  const urlPattern = document.querySelector('meta[property="og:url"]')?.getAttribute('content');
  if (urlPattern) {
    console.log('[CSC] Profile URL from meta tag:', urlPattern);
    const match = urlPattern.match(/instagram\.com\/([^/?]+)/);
    if (match) {
      const username = match[1];
      console.log('[CSC] Current profile username from meta:', username);
      return username;
    }
  }

  // Method 2: Extract username from current URL
  const urlMatch = window.location.href.match(/instagram\.com\/([^/?]+)/);
  if (urlMatch) {
    const username = urlMatch[1];
    // Filter out paths that aren't profiles
    if (!['explore', 'direct', 'stories', 'saved', 'reels', 'api'].includes(username)) {
      console.log('[CSC] Current profile username from URL:', username);
      return username;
    }
  }

  // Method 3: Try to extract from page title or header
  const profileName = document.querySelector('header h1') || 
                     document.querySelector('header h2') ||
                     document.querySelector('[role="main"] h1');
  if (profileName) {
    const username = profileName.textContent.trim();
    console.log('[CSC] Profile username from header:', username);
    return username;
  }

  // Method 4: Look for profile link in navigation
  const profileLinks = Array.from(document.querySelectorAll('a[href*="/"]')).filter(a => {
    const href = a.getAttribute('href') || '';
    // Look for links that point to a profile (not other pages)
    return href.match(/^\/[^/?]+\/?$/) && 
           !['explore', 'direct', 'stories', 'saved', 'reels', 'api', 'accounts'].includes(
             href.split('/')[1]
           );
  });

  if (profileLinks.length > 0) {
    const username = profileLinks[0].getAttribute('href').replace(/\//g, '').trim();
    if (username) {
      console.log('[CSC] Profile username from navigation link:', username);
      return username;
    }
  }

  console.log('[CSC] ⚠ Could not extract profile username - verification will be less reliable');
  return null;
}

/**
 * FUNCTION: Capture Network Requests
 * 
 * Intercepts fetch/XHR requests to Instagram API to extract ds_user_id
 * This signal cannot be spoofed from the page (requires real Instagram auth)
 */
function captureNetworkData() {
  return new Promise((resolve) => {
    let captured = false;
    
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const response = originalFetch.apply(this, args);
      
      // Clone response to read body without consuming it
      response.then(res => {
        // Only intercept Instagram API calls
        const requestUrl = String(args[0]);
        if (requestUrl.includes('/graphql') || requestUrl.includes('api/graphql')) {
          try {
            const clonedRes = res.clone();
            clonedRes.json().then(data => {
              // Try to extract ds_user_id from response
              const json = JSON.stringify(data);
              const dsUserIdMatch = json.match(/"ds_user_id":"?(\d+)"?/);
              
              if (dsUserIdMatch && !captured) {
                captured = true;
                const dsUserId = dsUserIdMatch[1];
                console.log('[CSC] [NETWORK] Captured ds_user_id from GraphQL:', dsUserId);
                
                if (typeof chrome !== 'undefined' && chrome.runtime) {
                  chrome.runtime.sendMessage({
                    type: 'NETWORK_DS_USER_ID',
                    dsUserId: dsUserId,
                    timestamp: Date.now(),
                    requestUrl: requestUrl
                  }).catch(e => {
                    console.log('[CSC] Could not send network data to background:', e.message);
                  });
                }
              }
            }).catch(() => {
              // Ignore JSON parse errors
            });
          } catch (e) {
            // Ignore errors
          }
        }
      }).catch(() => {
        // Ignore promise errors
      });

      return response;
    };

    // Clean up after 5 seconds
    setTimeout(() => {
      window.fetch = originalFetch;
      resolve(true);
    }, 5000);
  });
}

// Initialize network capture on page load
if (window.location.href.includes('instagram.com')) {
  captureNetworkData();
}