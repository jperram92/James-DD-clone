/**
 * Generate a random string ID
 * @param length Length of the ID (default: 8)
 * @returns Random string ID
 */
export const generateId = (length: number = 8): string => {
  return Math.random().toString(36).substring(2, 2 + length);
};

/**
 * Generate a random invite code for campaigns
 * @returns 6-character uppercase invite code
 */
export const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Format a timestamp to a readable date/time
 * @param timestamp ISO timestamp string
 * @param includeDate Whether to include the date (default: false)
 * @returns Formatted time string
 */
export const formatTime = (timestamp: string, includeDate: boolean = false): string => {
  const date = new Date(timestamp);
  
  if (includeDate) {
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

/**
 * Calculate ability score modifier
 * @param score Ability score (1-30)
 * @returns Ability modifier
 */
export const calculateModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

/**
 * Format modifier as a string with + or - sign
 * @param modifier Ability modifier
 * @returns Formatted modifier string
 */
export const formatModifier = (modifier: number): string => {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
};

/**
 * Roll a dice with the given number of sides
 * @param sides Number of sides on the dice
 * @param count Number of dice to roll (default: 1)
 * @returns Array of roll results
 */
export const rollDice = (sides: number, count: number = 1): number[] => {
  const results: number[] = [];
  
  for (let i = 0; i < count; i++) {
    results.push(Math.floor(Math.random() * sides) + 1);
  }
  
  return results;
};

/**
 * Debounce a function call
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array, or empty object)
 * @param value Value to check
 * @returns True if the value is empty
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
};
