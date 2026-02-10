import { AuthStorageService } from '../services/authStorage.js';

const isFirefox = typeof browser !== "undefined" && browser.runtime;

async function browserFetch(url, options) {
  if (isFirefox) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(options.method || 'GET', url);
      
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }
      
      xhr.onload = () => {
        resolve({
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          json: async () => JSON.parse(xhr.responseText),
          text: async () => xhr.responseText
        });
      };
      
      xhr.onerror = () => reject(new Error('Network request failed'));
      xhr.ontimeout = () => reject(new Error('Request timeout'));
      xhr.timeout = 10000; 
      
      xhr.send(options.body);
    });
  }
  
  return await fetch(url, options);
}

export async function login(username, password) {
  try {
    const res = await browserFetch(`${import.meta.env.VITE_BACKEND_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Login failed:", data.detail);
      return false;
    }



    await AuthStorageService.saveAuthState(
      data.access_token || 'dummy-token',
      { username, id: data.user_id || 1, display_content: data.display_content || false }
    );

    return true;
  } catch (err) {
    console.error("Error logging in:", err);
    return false;
  }
}

export async function signup(username, email, password, display_consent, cgu) {
  try {
    const res = await browserFetch(`${import.meta.env.VITE_BACKEND_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, display_consent, cgu })
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Signup failed:", data.detail);
      return false;
    }

    await AuthStorageService.saveAuthState(
      data.access_token || 'dummy-token',
      { username, email, id: data.user_id || 1 }
    );

    console.log("Signup successful:", data);
    return true;
  } catch (err) {
    console.error("Error signing up:", err);
    return false;
  }
}

export async function logout() {
  await AuthStorageService.clearAuthState();
  return true;
}