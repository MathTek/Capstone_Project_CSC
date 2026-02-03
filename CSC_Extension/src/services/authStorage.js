export class AuthStorageService {
  
  static async saveAuthState(token, userInfo) {
    try {
      await chrome.storage.local.set({
        authToken: token,
        userInfo: userInfo,
        authTimestamp: Date.now()
      });
    } catch (error) {
      console.error("Error saving auth state:", error);
    }
  }

  static async getAuthState() {
    try {
      const result = await chrome.storage.local.get(['authToken', 'userInfo', 'authTimestamp']);
      
      if (!result.authToken || !result.authTimestamp) {
        return { isAuthenticated: false };
      }

      const tokenAge = Date.now() - result.authTimestamp;
      const maxAge = 24 * 60 * 60 * 1000;
      
      if (tokenAge > maxAge) {
        await this.clearAuthState();
        return { isAuthenticated: false };
      }
      return {
        isAuthenticated: true,
        token: result.authToken,
        userInfo: result.userInfo
      };
    } catch (error) {
      console.error(" Error getting auth state:", error);
      return { isAuthenticated: false };
    }
  }

  static async clearAuthState() {
    try {
      await chrome.storage.local.remove(['authToken', 'userInfo', 'authTimestamp']);
    } catch (error) {
      console.error(" Error clearing auth state:", error);
    }
  }

  static async isLoggedIn() {
    const authState = await this.getAuthState();
    return authState.isAuthenticated;
  }
}
