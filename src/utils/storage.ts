import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

// Strips base64 data URIs (data:image/...;base64,...) from an object before
// it's persisted to AsyncStorage. Several fields in this app (avatar,
// identity verification documents, driver license/police-verification
// photos) are stored as raw base64 rather than uploaded-file URLs, and can
// easily exceed Android's AsyncStorage (SQLite-backed) per-row CursorWindow
// size limit (~2MB), causing "Row too big to fit into CursorWindow" crashes
// on every subsequent read. Stripped fields remain available in-memory for
// the current session (this only affects what gets written to disk) and are
// refetched from the server - a normal DB read, not row-size-constrained -
// on next app launch.
function stripDataUris(value: any, depth = 0): any {
  if (depth > 6) return value;
  if (typeof value === 'string') {
    return value.startsWith('data:') ? undefined : value;
  }
  if (Array.isArray(value)) {
    return value.map(v => stripDataUris(v, depth + 1));
  }
  if (value && typeof value === 'object') {
    const result: any = {};
    for (const key of Object.keys(value)) {
      const stripped = stripDataUris(value[key], depth + 1);
      if (stripped !== undefined) result[key] = stripped;
    }
    return result;
  }
  return value;
}

export const storage = {
  // Save token
  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  },

  // Get token
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Remove token
  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error removing token:', error);
      throw error;
    }
  },

  // Save user data
  async saveUserData(user: any): Promise<void> {
    try {
      const sanitized = stripDataUris(user);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(sanitized));
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  },

  // Get user data
  async getUserData(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      const parsed = data ? JSON.parse(data) : null;
      return parsed;
    } catch (error) {
      console.error('Error getting user data:', error);
      // The stored row is corrupted/oversized (e.g. Android's "Row too big to
      // fit into CursorWindow") and will fail on every future read too until
      // it's cleared - remove it so the next login can write a clean, smaller
      // entry instead of looping on this error forever.
      try {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      } catch (removeError) {
        console.error('Error clearing corrupted user data:', removeError);
      }
      return null;
    }
  },

  // Remove user data
  async removeUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Error removing user data:', error);
      throw error;
    }
  },

  // Save email
  async saveEmail(email: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EMAIL, email);
    } catch (error) {
      console.error('Error saving email:', error);
      throw error;
    }
  },

  // Get email
  async getEmail(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.EMAIL);
    } catch (error) {
      console.error('Error getting email:', error);
      return null;
    }
  },

  // Clear all data
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.EMAIL,
        STORAGE_KEYS.ONBOARDING_COMPLETED,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },

  // Save onboarding status
  async setOnboardingCompleted(completed: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, JSON.stringify(completed));
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  },

  // Get onboarding status
  async getOnboardingCompleted(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      return value === 'true' || value === 'true'; // Handle string 'true' or JSON true
    } catch (error) {
      console.error('Error getting onboarding status:', error);
      return false;
    }
  },

  // Recent Location Searches
  async getRecentLocationSearches(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_LOCATION_SEARCHES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting recent searches:', error);
      return [];
    }
  },

  async saveRecentLocationSearch(location: {
    description: string;
    place_id: string;
    structured_formatting: { main_text: string; secondary_text: string };
    latitude: number;
    longitude: number;
  }): Promise<void> {
    try {
      const existing = await this.getRecentLocationSearches();
      // Remove duplicate if exists
      const filtered = existing.filter((item: any) => item.place_id !== location.place_id);
      // Add to beginning and limit to 10 recent searches
      const updated = [location, ...filtered].slice(0, 10);
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_LOCATION_SEARCHES, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  },

  async clearRecentLocationSearches(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_LOCATION_SEARCHES);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  },
};
