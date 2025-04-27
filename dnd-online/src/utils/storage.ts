/**
 * Get item from localStorage with type safety
 * @param key Storage key
 * @returns Parsed value or null if not found
 */
export const getStorageItem = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error getting item from localStorage: ${key}`, error);
    return null;
  }
};

/**
 * Set item in localStorage with type safety
 * @param key Storage key
 * @param value Value to store
 */
export const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item in localStorage: ${key}`, error);
  }
};

/**
 * Remove item from localStorage
 * @param key Storage key
 */
export const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item from localStorage: ${key}`, error);
  }
};

/**
 * Clear all items from localStorage
 */
export const clearStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage', error);
  }
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'dnd_auth_token',
  USER_DATA: 'dnd_user_data',
  CURRENT_CAMPAIGN: 'dnd_current_campaign',
  CHARACTER_DRAFT: 'dnd_character_draft',
  SETTINGS: 'dnd_settings',
};
