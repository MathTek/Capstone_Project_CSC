import { get } from 'svelte/store';
import { detectPII } from '../utils/piiDetector.js';
import { AuthStorageService } from './authStorage.js';


// ─── Browser Compatibility ────────────────────────────────────────────────────

const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;
const isFirefox  = typeof browser !== 'undefined' && !!browser.runtime;

const BACKEND_URL     = import.meta.env.VITE_BACKEND_URL;
const REQUEST_TIMEOUT = 10_000; // ms
const SCRIPT_DELAY    = 1_500;  // ms – wait for content script injection

// ─── Network Helpers ──────────────────────────────────────────────────────────

/**
 * Cross-browser fetch wrapper.
 * Firefox MV2 extensions can't use the standard Fetch API from background
 * scripts, so we fall back to XMLHttpRequest.
 */
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
        ok:   xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        json: async () => JSON.parse(xhr.responseText),
        text: async () => xhr.responseText,
      });

    xhr.onerror   = () => reject(new Error('Network request failed'));
    xhr.ontimeout = () => reject(new Error('Request timed out'));

    xhr.send(options.body);
  });
}

/**
 * Sends the aggregated PII list to the backend and returns the privacy score.
 * @returns {Promise<number|null>}
 */
async function sendPIIList(piiList) {
  try {
    const authState = await AuthStorageService.getAuthState();
    const userId    = authState?.userInfo?.id;

    if (!userId) {
      console.error('[instagramService] User ID not found in auth state.');
      return null;
    }

    const response = await browserFetch(`${BACKEND_URL}/calculate_score`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pii_list: piiList, user_id: userId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[instagramService] Score calculation failed:', errorData);
      return null;
    }

    const data = await response.json();
    return data.score;
  } catch (err) {
    console.error('[instagramService] Network or server error:', err);
    return null;
  }
}

// ─── PII Aggregation Helpers ──────────────────────────────────────────────────

/**
 * Groups raw PII detections by type + source category and counts occurrences.
 * @param {Array} piiResults
 * @returns {Array<{type: string, source: string, occurrence: number}>}
 */
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

/**
 * Returns the list of unique PII types present in the results.
 * @param {Array} piiResults
 * @returns {string[]}
 */
function uniquePIITypes(piiResults) {
  return [...new Set(piiResults.map(e => e.type))];
}

// ─── Profile Data Processing ──────────────────────────────────────────────────

/**
 * Populates Svelte stores from the raw profile response received from the
 * content script and triggers the score calculation.
 * @param {object} response  Raw message from the content script.
 * @param {import('./scanStores').scanStores} stores
 */
async function processProfileResponse(response, stores) {
  const { bio, posts, profileInfo, results, numberOfPII, highlights, pii_types_number } = stores;
  // Bio
  const bioText = response.bio || 'No bio found';
  bio.set(bioText);
  results.set(detectPII(bioText, 'bio'));

  // Highlights
  const highlightsData = response.stories ?? [];
  highlights.set(highlightsData);
  highlightsData.forEach(({ title, index }) => {
    results.update(n => [...n, ...detectPII(title, `highlight ${index}`)]);
  });

  // Posts
  const postsData = response.posts ?? [];
  posts.set(postsData);
  postsData.forEach(({ content, index }) => {
    results.update(n => [...n, ...detectPII(content, `post ${index}`)]);
  });

  // Score & PII stats
  const currentResults = get(results);
  numberOfPII.set(currentResults.length);
  pii_types_number.set(uniquePIITypes(currentResults));

  const piiList = aggregatePII(currentResults);
  const score   = await sendPIIList(piiList);

  if (score !== null) {
    profileInfo.update(info => ({ ...info, last_score: score }));
  } else {
    console.error('[instagramService] Failed to receive score from server.');
  }

  // Profile metadata
  profileInfo.set({
    username:   response.username,
    followers:  response.followers,
    following:  response.following,
    postsCount: response.postsCount ?? postsData.length,
    url:        response.url,
  });

  const bioLabel = response.bio ? 'Bio' : 'No Bio';
  return `Extraction completed: ${bioLabel}, ${postsData.length} posts and ${highlightsData.length} highlights found`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Checks whether the active tab is on a specific Instagram profile page.
 * Updates the status store with a human-readable message.
 * @returns {Promise<boolean>}
 */
export async function checkInstagramPage(status) {
  return new Promise(resolve => {
    browserAPI.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab.url.includes('instagram.com')) {
        status.set('Please navigate to an Instagram profile');
        return resolve(false);
      }

      const isRootPage =
        tab.url.endsWith('instagram.com/') || tab.url.endsWith('instagram.com');

      if (isRootPage) {
        status.set('Please navigate to a specific Instagram profile');
        return resolve(false);
      }

      status.set('Instagram profile detected – Ready to scan');
      resolve(true);
    });
  });
}

/**
 * Injects the content script (if needed), triggers profile extraction, and
 * populates the provided Svelte stores with the results.
 * @param {import('./scanStores').scanStores} stores
 */
export async function extractProfileData(stores) {
  const { status, bio, loading } = stores;

  browserAPI.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
    if (!tab.url.includes('instagram.com')) {
      status.set('Please navigate to an Instagram profile');
      loading.set(false);
      return;
    }

    status.set('Checking content script…');

    // Inject content script – silently ignore if it's already injected.
    try {
      await browserAPI.scripting.executeScript({
        target: { tabId: tab.id },
        files:  ['content.js'],
      });
    } catch {
      // Already injected – proceed.
    }

    setTimeout(() => {
      status.set('Extracting profile data…');

      const fallbackTimeout = setTimeout(() => loading.set(false), REQUEST_TIMEOUT);

      browserAPI.tabs.sendMessage(tab.id, { action: 'getFullProfile' }, async response => {
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

        const statusMessage = await processProfileResponse(response, stores);

        status.set(statusMessage);
        loading.set(false);
      });
    }, SCRIPT_DELAY);
  });
}

/**
 * Reloads the active tab and updates the status store accordingly.
 */
export function reloadInstagramPage(status, loading) {
  browserAPI.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    browserAPI.tabs.reload(tab.id, () => {
      status.set('Page reloaded. Wait for reload then click Refresh.');
      loading.set(false);
    });
  });
}
