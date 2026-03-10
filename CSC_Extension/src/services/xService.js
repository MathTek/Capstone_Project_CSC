import { get } from 'svelte/store';
import { detectPII } from '../utils/piiDetector.js';
import { AuthStorageService } from './authStorage.js';

const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;
const isFirefox  = typeof browser !== 'undefined' && !!browser.runtime;

const BACKEND_URL     = import.meta.env.VITE_BACKEND_URL;
const REQUEST_TIMEOUT = 10_000;
const SCRIPT_DELAY    = 1_500;

async function browserFetch(url, options = {}) {
  if (!isFirefox) return fetch(url, options);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(options.method || 'GET', url);
    xhr.timeout = REQUEST_TIMEOUT;

    Object.entries(options.headers ?? {}).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.onload = () =>
      resolve({
        ok:     xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        json:   async () => JSON.parse(xhr.responseText),
        text:   async () => xhr.responseText,
      });

    xhr.onerror   = () => reject(new Error('Network request failed'));
    xhr.ontimeout = () => reject(new Error('Request timed out'));

    xhr.send(options.body);
  });
}

async function sendPIIList(piiList) {
  try {
    const authState = await AuthStorageService.getAuthState();
    const userId    = authState?.userInfo?.id;

    if (!userId) {
      console.error('[xService] User ID not found in auth state.');
      return null;
    }

    const response = await browserFetch(`${BACKEND_URL}/calculate_score`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pii_list: piiList, user_id: userId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[xService] Score calculation failed:', errorData);
      return null;
    }

    const data = await response.json();
    return data.score;
  } catch (err) {
    console.error('[xService] Network or server error:', err);
    return null;
  }
}

function aggregatePII(piiResults) {
  return piiResults.reduce((acc, element) => {
    const src      = element.source.split(' ')[0];
    const existing = acc.find(item => item.type === element.type && item.source === src);

    if (existing) {
      existing.occurrence += 1;
    } else {
      acc.push({ type: element.type, occurrence: 1, source: src });
    }

    return acc;
  }, []);
}

function uniquePIITypes(piiResults) {
  return [...new Set(piiResults.map(e => e.type))];
}

async function processXProfileResponse(response, stores) {
  const { bio, posts, profileInfo, results, numberOfPII, highlights, pii_types_number } = stores;

  const bioText = response.bio || 'No bio found';
  bio.set(bioText);
  results.set(detectPII(bioText, 'bio'));

  highlights.set([]);

  const postsData = response.posts ?? [];
  posts.set(postsData);
  postsData.forEach(({ content, index }) => {
    if (content) {
      results.update(n => [...n, ...detectPII(content, `tweet ${index}`)]);
    }
  });

  const currentResults = get(results);
  numberOfPII.set(currentResults.length);
  pii_types_number.set(uniquePIITypes(currentResults));

  const piiList = aggregatePII(currentResults);
  const score   = await sendPIIList(piiList);

  if (score !== null) {
    profileInfo.update(info => ({ ...info, last_score: score }));
  } else {
    console.error('[xService] Failed to receive score from server.');
  }

  profileInfo.set({
    username:   response.username,
    followers:  response.followers,
    following:  response.following,
    postsCount: response.postsCount ?? postsData.length,
    url:        response.url,
  });

  const bioLabel = response.bio ? 'Bio' : 'No Bio';
  return `Extraction completed: ${bioLabel}, ${postsData.length} tweets found`;
}

export async function checkXPage(status) {
  return new Promise(resolve => {
    browserAPI.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      const url = tab.url ?? '';

      const isX = url.includes('x.com') || url.includes('twitter.com');
      if (!isX) {
        status.set('Please navigate to an X profile');
        return resolve(false);
      }

      const nonProfilePaths = /\/(home|explore|notifications?|messages?|settings?|search|i\/|compose\/|login|signup)/i;
      if (nonProfilePaths.test(url)) {
        status.set('Please navigate to a specific X profile page');
        return resolve(false);
      }

      const pathMatch = url.match(/(?:x|twitter)\.com\/([^/?#]+)/);
      if (!pathMatch) {
        status.set('Please navigate to a specific X profile page');
        return resolve(false);
      }

      status.set('X profile detected – Ready to scan');
      resolve(true);
    });
  });
}

export async function extractXProfileData(stores) {
  const { status, bio, loading } = stores;

  browserAPI.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
    const url = tab.url ?? '';
    if (!url.includes('x.com') && !url.includes('twitter.com')) {
      status.set('Please navigate to an X profile');
      loading.set(false);
      return;
    }

    status.set('Checking content script…');

    try {
      await browserAPI.scripting.executeScript({
        target: { tabId: tab.id },
        files:  ['content.js'],
      });
    } catch {
    }

    setTimeout(() => {
      status.set('Extracting X profile data…');

      const fallbackTimeout = setTimeout(() => loading.set(false), REQUEST_TIMEOUT);

      browserAPI.tabs.sendMessage(tab.id, { action: 'getXProfile' }, async response => {
        clearTimeout(fallbackTimeout);

        if (browserAPI.runtime.lastError) {
          status.set(`Error: ${browserAPI.runtime.lastError.message}`);
          loading.set(false);
          return;
        }

        if (!response) {
          status.set('No data received from content script');
          bio.set('No data available');
          loading.set(false);
          return;
        }

        if (response.error) {
          status.set(`Error: ${response.error}`);
          loading.set(false);
          return;
        }

        const statusMessage = await processXProfileResponse(response, stores);
        status.set(statusMessage);
        loading.set(false);
      });
    }, SCRIPT_DELAY);
  });
}

export function reloadXPage(status, loading) {
  browserAPI.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    browserAPI.tabs.reload(tab.id, () => {
      status.set('Page reloaded. Wait for reload then click Refresh.');
      loading.set(false);
    });
  });
}
