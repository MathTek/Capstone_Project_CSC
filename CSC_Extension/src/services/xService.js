import { get } from 'svelte/store';
import { detectPII } from '../utils/piiDetector.js';
import { createSocialServiceHelpers } from './socialServiceBase.js';

const browserAPI = (typeof globalThis !== 'undefined' && (globalThis.browser || globalThis.chrome)) || undefined;

const BACKEND_URL     = import.meta.env.VITE_BACKEND_URL;
const REQUEST_TIMEOUT = 10_000;
const SCRIPT_DELAY    = 1_500;

const { sendPIIList, aggregatePII, uniquePIITypes } = createSocialServiceHelpers({
  backendUrl: BACKEND_URL,
  requestTimeout: REQUEST_TIMEOUT,
});

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
      results.update(n => [...n, ...detectPII(content, `post ${index}`)]);
    }
  });

  const currentResults = get(results);
  numberOfPII.set(currentResults.length);
  pii_types_number.set(uniquePIITypes(currentResults));


  const piiList = aggregatePII(currentResults);
  const score   = await sendPIIList(piiList, "X");

  if (score !== null) {
    profileInfo.set({
      username:   response.username,
      followers:  response.followers,
      following:  response.following,
      postsCount: response.postsCount ?? postsData.length,
      url:        response.url,
      last_score: score,
    });
  } else {
    profileInfo.set({
      username:   response.username,
      followers:  response.followers,
      following:  response.following,
      postsCount: response.postsCount ?? postsData.length,
      url:        response.url,
    });
  }


  const bioLabel = response.bio ? 'Bio' : 'No Bio';
  return `Extraction completed: ${bioLabel}, ${postsData.length} posts found`;
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
