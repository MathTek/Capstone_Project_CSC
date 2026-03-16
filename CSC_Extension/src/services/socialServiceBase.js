import { AuthStorageService } from './authStorage.js';

export function createSocialServiceHelpers({ backendUrl, requestTimeout }) {
  const browserLike = (typeof globalThis !== 'undefined' && (globalThis.browser || globalThis.chrome));
  const isFirefox = !!(typeof globalThis !== 'undefined' && globalThis.browser && globalThis.browser.runtime);

  async function browserFetch(url, options = {}) {
    if (!isFirefox) return fetch(url, options);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(options.method || 'GET', url);
      xhr.timeout = requestTimeout;

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
        return null;
      }

      const response = await browserFetch(`${backendUrl}/calculate_score`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pii_list: piiList, user_id: userId }),
      });

      if (!response.ok) {
        await response.json().catch(() => ({}));
        return null;
      }

      const data = await response.json();
      return data.score;
    } catch {
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

  return { sendPIIList, aggregatePII, uniquePIITypes };
}
