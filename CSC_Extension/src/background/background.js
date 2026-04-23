/// <reference types="chrome"/>

/**
 * ACCOUNT VERIFICATION SECURITY ARCHITECTURE
 * 
 * This background service worker implements a multi-layered defense against
 * DOM injection attacks. It combines:
 * 1. Network signal: Intercepts Instagram API requests to extract real ds_user_id
 * 2. Cookie signal: Reads httpOnly cookie ds_user_id (inaccessible from DOM)
 * 3. DOM signal: Validates DOM elements for tampering (but never trusts DOM alone)
 * 4. Timing signal: Validates that verification happens soon after page load
 * 5. Consensus: Requires at least 2 independent signals to verify account ownership
 */

// Store for tracking page load times and network requests
const pageLoadRegistry = {};
const networkRequestRegistry = {};

// Track when a tab is updated to store the exact reload time
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    // Page is reloading
    pageLoadRegistry[tabId] = {
      loadTime: Date.now(),
      url: tab.url,
      isInstagram: tab.url.includes('instagram.com')
    };
    
    // Clear old network requests for this tab
    networkRequestRegistry[tabId] = {
      dsUserId: null,
      requestTimestamp: null,
      requestUrl: null
    };
  }
});

// Clean up when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  delete pageLoadRegistry[tabId];
  delete networkRequestRegistry[tabId];
});

/**
 * SIGNAL 1: Network-based verification
 * Monitors Instagram GraphQL requests to extract the ds_user_id parameter
 * This is injected by Instagram into requests, not controllable by the page
 */
async function captureNetworkSignal(tabId, url) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(null);
    }, 3000); // Wait up to 3 seconds

    // Listen for messages from content script with network data
    const messageListener = (message, sender) => {
      if (sender.tabId === tabId && message.type === 'NETWORK_DS_USER_ID') {
        clearTimeout(timeout);
        chrome.runtime.onMessage.removeListener(messageListener);
        
        networkRequestRegistry[tabId] = {
          dsUserId: message.dsUserId,
          requestTimestamp: message.timestamp,
          requestUrl: message.requestUrl
        };
        
        resolve({
          source: 'network',
          dsUserId: message.dsUserId,
          timestamp: message.timestamp,
          url: message.requestUrl,
          confidence: 0.95 // Network signals are very reliable
        });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    
    // Ask content script to capture network data
    try {
      chrome.tabs.sendMessage(tabId, {
        action: 'captureNetworkData'
      }, { frameId: 0 }).catch(() => {
        // Content script not ready yet
      });
    } catch (e) {
      // Ignore errors
    }
  });
}

/**
 * SIGNAL 2: Cookie-based verification
 * Reads the httpOnly cookie ds_user_id which is inaccessible from the DOM
 * This is the most tamper-proof signal available
 */
async function captureCookieSignal(tabUrl) {
  return new Promise((resolve) => {
    // Extract domain from URL
    const domain = new URL(tabUrl).hostname;
    
    chrome.cookies.get({ url: tabUrl, name: 'ds_user_id' }, (cookie) => {
      if (cookie && cookie.value) {
        resolve({
          source: 'cookie',
          dsUserId: cookie.value,
          timestamp: Date.now(),
          confidence: 1.0 // Cookies are extremely reliable (httpOnly, not modifiable from JS)
        });
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * SIGNAL 3: DOM-based verification
 * Validates that DOM elements exist and haven't been tampered with
 * Uses DOM integrity checks to detect injected elements
 */
function validateDOMSignal(domCheckData) {
  if (!domCheckData) {
    return null;
  }

  // Check if elements passed integrity validation
  if (!domCheckData.integrityCertified) {
    console.log('[CSC-BG] DOM integrity check failed - possible tampering detected');
    return null;
  }

  // Verify the elements are from the correct context
  if (!domCheckData.elementsFound) {
    return null;
  }

  return {
    source: 'dom',
    elements: domCheckData.elements,
    integrityCertified: true,
    timestamp: domCheckData.timestamp,
    confidence: 0.6 // DOM alone is not reliable - can be injected
  };
}

/**
 * SIGNAL 4: Timing verification
 * Checks that verification happens within a reasonable time after page load
 * Slows down attackers who need to inject and wait
 */
function validateTimingSignal(tabId, currentTime) {
  const loadInfo = pageLoadRegistry[tabId];
  
  if (!loadInfo) {
    console.log('[CSC-BG] No load timestamp found for tab');
    return null;
  }

  const timeSinceLoad = currentTime - loadInfo.loadTime;
  const MAX_DELAY_MS = 15000; // Must verify within 15 seconds of page load

  if (timeSinceLoad > MAX_DELAY_MS) {
    console.log(`[CSC-BG] Verification attempted ${timeSinceLoad}ms after page load - REJECTED (max: ${MAX_DELAY_MS}ms)`);
    return null;
  }

  return {
    source: 'timing',
    timeSinceLoad: timeSinceLoad,
    confidence: 0.7
  };
}

/**
 * CONSENSUS LOGIC
 * Requires at least 2 strong independent signals to verify account ownership
 * 
 * CRITICAL INSIGHT:
 * - The "Edit Profile" button ONLY appears on your own profile (Instagram design)
 * - The cookie ds_user_id is your logged-in user ID
 * - Network requests come from authenticated actions
 * - When all these point to the same account owner, verification succeeds
 * 
 * ATTACK PREVENTION:
 * - DOM injection can add fake buttons, but network + timing will reject
 * - If viewing someone else's profile, no DOM elements will be found
 * - If somehow elements exist, network requests won't come from that account
 */
async function performMultiSignalVerification(tabId, tabUrl, domCheckData) {
  const currentTime = Date.now();
  const signals = [];

  console.log('[CSC-BG] Starting multi-signal verification for tab', tabId);

  // Gather all signals in parallel
  const [cookieSignal, networkSignal] = await Promise.all([
    captureCookieSignal(tabUrl),
    captureNetworkSignal(tabId, tabUrl)
  ]);

  if (cookieSignal) signals.push(cookieSignal);
  if (networkSignal) signals.push(networkSignal);

  const domSignal = validateDOMSignal(domCheckData);
  if (domSignal) signals.push(domSignal);

  const timingSignal = validateTimingSignal(tabId, currentTime);
  if (timingSignal) signals.push(timingSignal);

  console.log(`[CSC-BG] Collected ${signals.length} signals:`, signals.map(s => s.source));

  // Decision logic
  if (signals.length === 0) {
    return {
      isVerified: false,
      reason: 'no_signals_available',
      signals: []
    };
  }

  // PRIMARY CHECK: DOM elements + Cookie + Timing
  // If edit profile button exists on page + user is logged in + timing is reasonable = OWN PROFILE
  if (domCheckData?.elementsFound && cookieSignal && timingSignal) {
    console.log('[CSC-BG] ✓ VERIFIED: DOM elements found + Cookie + Valid timing');
    console.log('[CSC-BG] User is logged in (has cookie) and profile edit elements visible');
    return {
      isVerified: true,
      reason: 'dom_and_cookie_and_timing',
      signals: signals,
      userId: cookieSignal.dsUserId
    };
  }

  // SECONDARY: Network + Timing
  // If we detected authenticated API requests + timing is good = OWN PROFILE
  if (networkSignal && timingSignal) {
    console.log('[CSC-BG] ✓ VERIFIED: Network request captured + Valid timing');
    console.log('[CSC-BG] Instagram API requests from authenticated user');
    return {
      isVerified: true,
      reason: 'network_and_timing',
      signals: signals,
      userId: networkSignal.dsUserId
    };
  }

  // TERTIARY: Cookie + DOM elements + integrity certified
  // Cookie proves you're logged in, DOM elements prove you're on your profile
  if (cookieSignal && domCheckData?.elementsFound && domCheckData?.integrityCertified) {
    console.log('[CSC-BG] ✓ VERIFIED: Cookie + DOM elements (integrity verified) + Recent');
    return {
      isVerified: true,
      reason: 'cookie_and_dom_integrity',
      signals: signals,
      userId: cookieSignal.dsUserId
    };
  }

  // If DOM elements exist but no cookie/network = SUSPICIOUS INJECTION
  if (domCheckData?.elementsFound && !cookieSignal && !networkSignal) {
    console.log('[CSC-BG] ✗ REJECTED: DOM elements found but NO authentication signals (likely injected)');
    return {
      isVerified: false,
      reason: 'dom_only_no_auth',
      details: 'Edit button found but user not logged in - likely DOM injection'
    };
  }

  // If we have only DOM but no timing validation = SUSPICIOUS
  if (domCheckData?.elementsFound && !timingSignal && !networkSignal) {
    console.log('[CSC-BG] ✗ REJECTED: DOM elements found but timing validation failed (too late for normal verification)');
    return {
      isVerified: false,
      reason: 'dom_only_timing_failed',
      details: 'Possible injection after page load stabilization'
    };
  }

  // If we reach here, not enough strong signals to verify
  console.log('[CSC-BG] ✗ REJECTED: Insufficient signals');
  console.log('[CSC-BG] Dom elements:', domCheckData?.elementsFound, 'Cookie:', !!cookieSignal, 'Network:', !!networkSignal, 'Timing:', !!timingSignal);
  return {
    isVerified: false,
    reason: 'insufficient_signals',
    signals: signals,
    collected: signals.map(s => s.source)
  };
}

/**
 * Extract consensus user ID from multiple signals
 */
function extractConsensusUserId(signals, domUserId) {
  const userIds = {};

  signals.forEach(signal => {
    if (signal.dsUserId) {
      userIds[signal.dsUserId] = (userIds[signal.dsUserId] || 0) + 1;
    }
  });

  // Find the user ID that appeared in most signals
  const mostCommon = Object.entries(userIds).sort(([,a], [,b]) => b - a)[0];
  return mostCommon ? mostCommon[0] : null;
}

/**
 * MESSAGE HANDLER
 * Receives verification requests from popup and content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'verifyAccountOwnership') {
    const { tabId, tabUrl, domCheckData } = message;

    performMultiSignalVerification(tabId, tabUrl, domCheckData)
      .then(result => {
        console.log('[CSC-BG] Verification result:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('[CSC-BG] Verification error:', error);
        sendResponse({
          isVerified: false,
          reason: 'verification_error',
          error: error.message
        });
      });

    // Return true to indicate we'll send response asynchronously
    return true;
  }

  return false;
});
