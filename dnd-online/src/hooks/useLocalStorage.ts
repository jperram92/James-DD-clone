import { useEffect } from 'react';
import { StoreApi, UseBoundStore } from 'zustand';
import { getStorageItem, setStorageItem } from '../utils/storage';

/**
 * Custom hook for persisting Zustand store state in localStorage
 * @param store Zustand store
 * @param storageKey localStorage key
 * @param includeKeys Optional array of keys to include (if not provided, all keys are included)
 */
export const useLocalStorage = <T extends object>(
  store: UseBoundStore<StoreApi<T>>,
  storageKey: string,
  includeKeys?: (keyof T)[]
): void => {
  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = getStorageItem<Partial<T>>(storageKey);
    
    if (savedState) {
      // If includeKeys is provided, only set those keys
      if (includeKeys) {
        const filteredState = Object.fromEntries(
          Object.entries(savedState).filter(([key]) => 
            includeKeys.includes(key as keyof T)
          )
        ) as Partial<T>;
        
        store.setState(filteredState);
      } else {
        store.setState(savedState);
      }
    }
  }, [store, storageKey, includeKeys]);

  // Save state to localStorage when it changes
  useEffect(() => {
    const unsubscribe = store.subscribe((state) => {
      // If includeKeys is provided, only save those keys
      if (includeKeys) {
        const filteredState = Object.fromEntries(
          Object.entries(state).filter(([key]) => 
            includeKeys.includes(key as keyof T)
          )
        ) as Partial<T>;
        
        setStorageItem(storageKey, filteredState);
      } else {
        setStorageItem(storageKey, state);
      }
    });
    
    return unsubscribe;
  }, [store, storageKey, includeKeys]);
};
