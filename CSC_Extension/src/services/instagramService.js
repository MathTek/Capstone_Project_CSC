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
  sourceLabel: 'instagramService'
});

async function processProfileResponse(response, stores) {
  const { bio, posts, profileInfo, results, numberOfPII, highlights, pii_types_number } = stores;

  const bioText = response.bio || 'No bio found';
  bio.set(bioText);
  results.set(detectPII(bioText, 'bio'));

  const highlightsData = response.stories ?? [];
  highlights.set(highlightsData);
  highlightsData.forEach(({ title, index }) => {
    results.update(n => [...n, ...detectPII(title, `highlight ${index}`)]);
  });

  const postsData = response.posts ?? [];
  posts.set(postsData);
  postsData.forEach(({ content, index }) => {
    results.update(n => [...n, ...detectPII(content, `post ${index}`)]);
  });

  const currentResults = get(results);
  numberOfPII.set(currentResults.length);
  pii_types_number.set(uniquePIITypes(currentResults));

  const piiList = aggregatePII(currentResults);
  const score   = await sendPIIList(piiList);

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
  return `Extraction completed: ${bioLabel}, ${postsData.length} posts and ${highlightsData.length} highlights found`;
}

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

export async function extractProfileData(stores) {
  const { status, bio, loading } = stores;

  browserAPI.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
    if (!tab.url.includes('instagram.com')) {
      status.set('Please navigate to an Instagram profile');
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

export function reloadInstagramPage(status, loading) {
  browserAPI.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    browserAPI.tabs.reload(tab.id, () => {
      status.set('Page reloaded. Wait for reload then click Refresh.');
      loading.set(false);
    });
  });
}
