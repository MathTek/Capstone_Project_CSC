
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

  if (!selectedBio) {
    return null;
  }

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
  const collected = document.querySelectorAll(
  'a[href*="/p/"], a[href*="/reel/"], a[href*="/tv/"]'
  );

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
  
  const storySelectors = [
    'a[href*="/stories/highlights/"]'
  ];

  let storyElements = [];
  
  for (const selector of storySelectors) {
    storyElements = [...document.querySelectorAll(selector)];
    if (storyElements.length > 0) {
      break;
    }
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
    if (pattern.test(text)) {
      return false;
    }
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

if (typeof chrome !== "undefined" && chrome.runtime) {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  
  
  if (msg.action === "getFullProfile") {
    waitForProfileData()
    .then(profileData => {
      sendResponse(profileData);
    })
    .catch(error => {
      sendResponse({ 
      bio: null, 
      posts: [], 
      username: null,
      error: error.message 
      });
    });
    return true; 
  }


  sendResponse({ error: "Unknown action: " + msg.action });
  return false;
  });
}

export {};
