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

function getFacebookBio() {
  // ── Stratégie 1 : XPath exact (le plus précis, fragile si layout change)
  try {
    const xpathResult = document.evaluate(
      '//*[@id="mount_0_0_rf"]/div/div[1]/div/div[3]/div/div/div[1]/div[1]/div/div/div[1]/div[2]/div/div/div/div[2]/div/div/div[2]/span',
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    const bioEl = xpathResult.singleNodeValue;
    const text = bioEl?.textContent?.trim();
    if (text && text.length > 5 && text.length < 500) return text;
  } catch (_) {}

  // ── Stratégie 2 : CSS approximatif basé sur la structure XPath
  // div[3] = 3ème enfant direct de la colonne principale
  // On cible le mount root, on navigue vers la sidebar (div[3])
  try {
    const mount = document.getElementById('mount_0_0_rf');
    if (mount) {
      // Reconstitution CSS depuis le XPath
      const sidebar = mount.querySelector(
        ':scope > div > div:nth-child(1) > div > div:nth-child(3)'
      );
      if (sidebar) {
        // Dans la sidebar, cibler les spans "orphelins" (bio = texte pur sans lien ni SVG)
        const spans = sidebar.querySelectorAll('span');
        for (const span of spans) {
          if (
            span.children.length === 0 &&          // texte pur
            !span.closest('a') &&                   // pas dans un lien
            !span.closest('[role="button"]') &&     // pas un bouton
            span.textContent.trim().length > 10 &&
            span.textContent.trim().length < 500
          ) {
            return span.textContent.trim();
          }
        }
      }
    }
  } catch (_) {}

  // ── Stratégie 3 : data-pagelet (fallback stable)
  const pagelet = document.querySelector(
    '[data-pagelet="ProfileAppSection_0"], [data-pagelet="ProfileTilesFeed_0"]'
  );
  if (pagelet) {
    const spans = pagelet.querySelectorAll('span');
    for (const span of spans) {
      const text = span.textContent?.trim();
      if (
        span.children.length === 0 &&
        !span.closest('a') &&
        !span.closest('[role="button"]') &&
        text?.length > 10 &&
        text?.length < 500
      ) {
        return text;
      }
    }
  }

  // ── Stratégie 4 : JSON GraphQL injecté par Facebook
  try {
    const scripts = document.querySelectorAll('script[type="application/json"]');
    for (const script of scripts) {
      const raw = script.textContent ?? '';
      if (raw.includes('"biography"') || raw.includes('"bio"')) {
        const json = JSON.parse(raw);
        const bio = extractDeep(json, 'biography') ?? extractDeep(json, 'bio');
        if (bio && bio.length > 5 && bio.length < 500) return bio;
      }
    }
  } catch (_) {}

  // ── Stratégie 5 : og:description (bio tronquée)
  const meta =
    document.querySelector('meta[property="og:description"]') ??
    document.querySelector('meta[name="description"]');
  const metaText = meta?.getAttribute('content')?.trim();
  if (metaText && metaText.length > 10) return metaText;

  return null;
}

function extractDeep(obj, key, depth = 0) {
  if (depth > 12 || !obj || typeof obj !== 'object') return null;
  if (typeof obj[key] === 'string' && obj[key].length > 0) return obj[key];
  for (const v of Object.values(obj)) {
    const found = extractDeep(v, key, depth + 1);
    if (found) return found;
  }
  return null;
}

function getFacebookPosts() {
  const posts = [];
  const seen = new Set();
  let index = 1;

  const postSelectors = [
    '[data-testid="feed_story_container"]',
    '[role="article"]',
    'div[data-testid^="post"]',
    '.x1yztbdb > div > div',
  ];

  const postElements = [];
  for (const selector of postSelectors) {
    postElements.push(...document.querySelectorAll(selector));
  }

  const uniquePosts = [...new Set(postElements)];

  for (const article of uniquePosts) {
    const articleEl = /** @type {HTMLElement|null} */ (article);
    if (!articleEl) continue;

    const textSelectors = [
      '[data-testid="post_message"]',
      'div[data-testid*="post"] span',
      'div[role="presentation"] > span',
      '.xdj266r > span'
    ];

    let textContent = '';
    for (const selector of textSelectors) {
      const textEl = /** @type {HTMLElement|null} */ (articleEl.querySelector(selector));
      if (textEl) {
        textContent = textEl.innerText?.trim() ?? '';
        if (textContent) break;
      }
    }
    
    if (!textContent || textContent.length < 2 || seen.has(textContent)) continue;

    let url = null;
    const link = /** @type {HTMLAnchorElement|null} */ (articleEl.querySelector('a[href*="/posts/"], a[href*="/photo.php"], a[href*="/watch/"], a[href*="/reel/"]'));
    if (link) url = link.href;

    seen.add(textContent);
    posts.push({
      content: textContent,
      url,
      index: index++,
      type: 'post'
    });

    if (posts.length >= 30) break;
  }

  return posts;
}

function getFacebookUsername() {
  const userNameSelectors = [
    '[data-testid="profile_name_header"]',
    'h1',
    '[role="banner"] h1',
    '[data-testid="profile"] h1',
  ];

  for (const selector of userNameSelectors) {
    const userNameEl = /** @type {HTMLElement|null} */ (document.querySelector(selector));
    if (userNameEl) {
      const text = userNameEl.innerText?.trim();
      if (text && text.length > 0 && text.length < 100) return text;
    }
  }

  const ogProfile = document.querySelector('meta[property="og:title"]');
  if (ogProfile) {
    const title = ogProfile.getAttribute('content');
    if (title) return title.trim();
  }

  return null;
}

function getFacebookStats() {
  const stats = { followers: null, following: null };

  const statLinks = [
    ...document.querySelectorAll('a[href*="/followers/"]'),
    ...document.querySelectorAll('a[href*="/friends"]'),
    ...document.querySelectorAll('[data-testid="profile_stats"] a'),
  ];
  
  for (const link of statLinks) {
    const linkEl = /** @type {HTMLElement} */ (link);
    const text = linkEl.textContent?.toLowerCase() || '';
    const match = text.match(/([\d,KMB.]+)\s*(followers?|amis|friends|suiveurs)/i);
    
    if (match) {
      const number = match[1];
      if (text.includes('follow') || text.includes('suiveur')) {
        stats.followers = number;
      } else if (text.includes('friend') || text.includes('ami')) {
        stats.following = number;
      }
    }
  }

  return stats;
}

async function getFullFacebookProfileData() {
  const { followers, following } = getFacebookStats();
  return {
    platform: 'facebook',
    bio: getFacebookBio(),
    posts: getFacebookPosts(),
    stories: [],
    username: getFacebookUsername(),
    followers,
    following,
    postsCount: null,
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

    sendResponse({ error: "Unknown action: " + msg.action });
    return false;
  });
}
