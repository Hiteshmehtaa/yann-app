import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

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
      // console.log('💾 Saving user data to storage:', { ... }); // Commented out
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      // console.log('✅ User data saved successfully'); // Commented out
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
      // console.log('📂 Loaded user data from storage:', { ... }); // Commented out
      return parsed;
    } catch (error) {
      console.error('Error getting user data:', error);
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
