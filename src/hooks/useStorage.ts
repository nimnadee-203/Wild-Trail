import { useState, useEffect, useCallback } from 'react';
import { storageService, StorageKey } from '../storage';

export function useStorage<T>(key: StorageKey, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadStoredValue = useCallback(async () => {
    setIsLoading(true);
    const value = await storageService.getItem<T>(key);
    if (value !== null) {
      setStoredValue(value);
    }
    setIsLoading(false);
  }, [key]);

  useEffect(() => {
    loadStoredValue();
  }, [loadStoredValue]);

  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      await storageService.setItem(key, valueToStore);
    } catch (error) {
      console.error(`Error saving to storage key ${key}:`, error);
    }
  };

  const removeValue = async () => {
    setStoredValue(initialValue);
    await storageService.removeItem(key);
  };

  return { value: storedValue, setValue, removeValue, isLoading, refresh: loadStoredValue };
}
