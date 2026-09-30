import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKey } from './keys';

/**
 * Scalable, type-safe wrapper for AsyncStorage.
 * Enables future offline/local persistence for Ranger and Community modules.
 */
export const storageService = {
  async getItem<T>(key: StorageKey): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? (JSON.parse(jsonValue) as T) : null;
    } catch (e) {
      console.error(`Error reading storage key ${key}:`, e);
      return null;
    }
  },

  async setItem<T>(key: StorageKey, value: T): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (e) {
      console.error(`Error setting storage key ${key}:`, e);
      return false;
    }
  },

  async removeItem(key: StorageKey): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`Error removing storage key ${key}:`, e);
      return false;
    }
  },

  async clearAll(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (e) {
      console.error('Error clearing storage:', e);
      return false;
    }
  },
};

export default storageService;
