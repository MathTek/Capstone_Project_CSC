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
  sourceLabel: 'facebookService'
});

async function processFacebookProfileResponse(response, stores) {
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
  const score   = await sendPIIList(piiList);

  if (score !== null) {
    profileInfo.update(info => ({ ...info, last_score: score }));
  }

  profileInfo.set({
    username:   response.username,
    followers:  response.followers,
    following:  response.following,
    postsCount: response.postsCount ?? postsData.length,
    url:        response.url,
  });

  const bioLabel = response.bio ? 'Bio' : 'No Bio';
  return `Extraction completed: ${bioLabel}, ${postsData.length} posts found`;
}

export async function checkFacebookPage(status) {
  return new Promise(resolve => {
    browserAPI.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab.url.includes('facebook.com')) {
        status.set('Please navigate to a Facebook profile');
        return resolve(false);
      }

      const url = tab.url;
      const isProfileLike =
        url.match(/facebook\.com\/[^/?#]+\/?$/) ||
        url.match(/facebook\.com\/profile\.php\?id=/) ||
        url.match(/facebook\.com\/[^/?#]+\/(posts|about|photos|videos)/);

      if (!isProfileLike) {
        status.set('Please navigate to a specific Facebook profile page');
        return resolve(false);
      }

      status.set('Facebook profile detected – Ready to scan');
      resolve(true);
    });
  });
}

export async function extractFacebookProfileData(stores) {
  const { status, bio, loading } = stores;

  browserAPI.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
    if (!tab.url.includes('facebook.com')) {
      status.set('Please navigate to a Facebook profile');
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
      status.set('Extracting Facebook profile data…');

      const fallbackTimeout = setTimeout(() => loading.set(false), REQUEST_TIMEOUT);

      browserAPI.tabs.sendMessage(tab.id, { action: 'getFacebookProfile' }, async response => {
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

        const statusMessage = await processFacebookProfileResponse(response, stores);
        status.set(statusMessage);
        loading.set(false);
      });
    }, SCRIPT_DELAY);
  });
}

export function reloadFacebookPage(status, loading) {
  browserAPI.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    browserAPI.tabs.reload(tab.id, () => {
      status.set('Page reloaded. Wait for reload then click Refresh.');
      loading.set(false);
    });
  });
}
