
import { AuthStorageService } from '../services/authStorage.js';

export async function login(username, password) {
  try {
    const res = await fetch("http://localhost:8000/login", {
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
    const res = await fetch("http://localhost:8000/register", {
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