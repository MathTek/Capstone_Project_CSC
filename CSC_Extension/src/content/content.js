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

  console.log(" Extracted profile data:", profileData);

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

async function getFullProfileDataWithStories() {
  const profileData = await getFullProfileData();
  profileData.stories = await getAllProfileStories();
  return profileData;
}

function getFacebookBio() {
  const introContainer = document.querySelector(
    '[aria-label="Introduction"], [aria-label="Introduction"i]'
  );
  if (introContainer) {
    const spans = [...introContainer.querySelectorAll('span, div')].filter(
      el =>
        el.children.length === 0 &&
        el.textContent.trim().length > 10 &&
        !el.textContent.trim().match(/^(modifier|edit|add bio|ajouter une bio)$/i)
    );
    if (spans.length > 0) {
      return spans.map(s => s.textContent.trim()).join(' ').replace(/\s+/g, ' ').trim();
    }
    const raw = introContainer.textContent.trim();
    if (raw.length > 5) return raw.replace(/\s+/g, ' ').trim();
  }

  const aboutListItems = [
    ...document.querySelectorAll('div[data-pagelet="ProfileAppSection_0"] li'),
    ...document.querySelectorAll('div[data-pagelet="ProfileAppSection_1"] li'),
  ];
  const candidateTexts = aboutListItems
    .map(li => li.textContent.trim())
    .filter(t => t.length > 5 && t.length < 400 && !t.match(/^(modifier|edit|add|ajouter)$/i));
  if (candidateTexts.length > 0) {
    return candidateTexts.join(' • ').replace(/\s+/g, ' ').trim();
  }

  const allLeafs = [
    ...document.querySelectorAll('[role="main"] span, [role="main"] div'),
  ].filter(el => {
    if (el.children.length !== 0) return false;
    const t = el.textContent.trim();
    if (!t || t.length < 20 || t.length > 350) return false;
    if (t.match(/^(\d+\s*(j|h|min|s|d|w|likes?|comments?|shares?|reactions?))$/i)) return false;
    if (t.match(/^(voir plus|see more|voir moins|see less|modifier|edit)$/i)) return false;
    return true;
  });

  const scored = allLeafs.map(el => {
    const t = el.textContent.trim();
    let score = 0;
    if (t.length >= 30 && t.length <= 250) score += 8;
    if (t.includes(' ') && t.split(' ').length >= 3) score += 5;
    if (t.match(/[.!?]$/)) score += 3;
    if (t.includes('@') || t.match(/https?:\/\//)) score += 2;
    if (t.match(/(travail|work|étudiant|student|vit à|lives in|de |from )/i)) score += 4;
    return { el, t, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored.find(c => c.score > 5);
  if (best) return best.t.replace(/\s+/g, ' ').trim();

  return null;
}

function getFacebookPosts() {
  const posts = [];
  const seen  = new Set();
  let   index = 1;

  const feedUnits = [
    ...document.querySelectorAll('[data-pagelet^="FeedUnit"]'),
    ...document.querySelectorAll('[role="article"]'),
    ...document.querySelectorAll('div.x1yztbdb, div.x1n2onr6'),
  ];

  for (const unit of feedUnits) {
    const text = extractFacebookPostText(unit);
    if (!text || seen.has(text)) continue;

    let url = null;
    const timeLink = /** @type {HTMLAnchorElement|null} */ (unit.querySelector(
      'a[href*="/posts/"], a[href*="/permalink/"], a[href*="story_fbid="]'
    ));
    if (timeLink) url = timeLink.href;

    seen.add(text);
    posts.push({ content: text, url, index: index++, type: 'post' });
  }

  const unique = [];
  const seenContent = new Set();
  for (const p of posts) {
    if (!seenContent.has(p.content)) {
      seenContent.add(p.content);
      unique.push(p);
    }
  }

  return unique;
}

function extractFacebookPostText(unit) {
  const msgContainer = unit.querySelector(
    '[data-ad-comet-preview="message"], [data-ad-preview="message"]'
  );
  if (msgContainer) {
    const text = msgContainer.innerText?.trim();
    if (text && text.length > 0) return text;
  }

  const dirAutoSpans = [...unit.querySelectorAll('span[dir="auto"]')].filter(el => {
    const t = el.textContent.trim();
    if (!t || t.length < 5) return false;
    if (t.match(/^\d+$/)) return false;
    if (t.match(/^(j'aime|like|commenter|comment|partager|share|réagir|react)s?$/i)) return false;
    return true;
  });

  if (dirAutoSpans.length > 0) {
    dirAutoSpans.sort((a, b) => b.textContent.length - a.textContent.length);
    const best = dirAutoSpans[0].innerText?.trim();
    if (best && best.length > 5) return best;
  }

  const langDiv = unit.querySelector('div[lang]');
  if (langDiv) {
    const t = langDiv.innerText?.trim();
    if (t && t.length > 5) return t;
  }

  return null;
}

function getFacebookUsername() {
  const h1 = document.querySelector('h1');
  if (h1) {
    const name = h1.innerText?.trim();
    if (name && name.length > 0 && name.length < 100) return name;
  }

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) return ogTitle.getAttribute('content')?.trim() ?? null;

  return null;
}

async function getFullFacebookProfileData() {
  return {
    platform:   'facebook',
    bio:        getFacebookBio(),
    posts:      getFacebookPosts(),
    stories:    [],
    username:   getFacebookUsername(),
    followers:  null,
    following:  null,
    postsCount: null,
    url:        window.location.href,
    timestamp:  new Date().toISOString(),
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

const browserAPI = (typeof browser !== "undefined" && browser.runtime) ? browser : chrome;

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

export {};
