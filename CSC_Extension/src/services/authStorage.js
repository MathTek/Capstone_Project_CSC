// Service d'authentification avec persistance
export class AuthStorageService {
  
  // Sauvegarder l'état d'authentification
  static async saveAuthState(token, userInfo) {
    try {
      await chrome.storage.local.set({
        authToken: token,
        userInfo: userInfo,
        authTimestamp: Date.now()
      });
      console.log("✅ Auth state saved");
    } catch (error) {
      console.error("❌ Error saving auth state:", error);
    }
  }

  // Récupérer l'état d'authentification
  static async getAuthState() {
    try {
      const result = await chrome.storage.local.get(['authToken', 'userInfo', 'authTimestamp']);
      
      if (!result.authToken || !result.authTimestamp) {
        return { isAuthenticated: false };
      }

      // Vérifier si le token n'a pas expiré (24h par exemple)
      const tokenAge = Date.now() - result.authTimestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 heures
      
      if (tokenAge > maxAge) {
        console.log("🕐 Auth token expired");
        await this.clearAuthState();
        return { isAuthenticated: false };
      }

      return {
        isAuthenticated: true,
        token: result.authToken,
        userInfo: result.userInfo
      };
    } catch (error) {
      console.error("❌ Error getting auth state:", error);
      return { isAuthenticated: false };
    }
  }

  // Supprimer l'état d'authentification
  static async clearAuthState() {
    try {
      await chrome.storage.local.remove(['authToken', 'userInfo', 'authTimestamp']);
      console.log("✅ Auth state cleared");
    } catch (error) {
      console.error("❌ Error clearing auth state:", error);
    }
  }

  // Vérifier si l'utilisateur est connecté
  static async isLoggedIn() {
    const authState = await this.getAuthState();
    return authState.isAuthenticated;
  }
}
