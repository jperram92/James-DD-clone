import { useEffect, useCallback, useRef } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface KeyboardShortcutOptions {
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  preventDefault?: boolean;
  enabled?: boolean;
}

/**
 * Custom hook for handling keyboard shortcuts
 * @param keys Key or array of keys to listen for
 * @param callback Function to call when the shortcut is triggered
 * @param options Shortcut options
 */
export const useKeyboardShortcut = (
  keys: string | string[],
  callback: KeyHandler,
  options: KeyboardShortcutOptions = {}
): void => {
  // Default options
  const {
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    metaKey = false,
    preventDefault = true,
    enabled = true,
  } = options;

  // Convert keys to array if string
  const targetKeys = Array.isArray(keys) ? keys : [keys];
  
  // Use ref for callback to avoid re-creating the handler on every render
  const callbackRef = useRef<KeyHandler>(callback);
  
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Event handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if disabled
      if (!enabled) return;
      
      // Check if the key matches any of the target keys
      const isTargetKey = targetKeys.some(
        (key) => key.toLowerCase() === event.key.toLowerCase()
      );
      
      // Check if modifier keys match
      const modifiersMatch =
        event.ctrlKey === ctrlKey &&
        event.shiftKey === shiftKey &&
        event.altKey === altKey &&
        event.metaKey === metaKey;
      
      // If all conditions match, call the callback
      if (isTargetKey && modifiersMatch) {
        if (preventDefault) {
          event.preventDefault();
        }
        callbackRef.current(event);
      }
    },
    [targetKeys, ctrlKey, shiftKey, altKey, metaKey, preventDefault, enabled]
  );

  // Add and remove event listener
  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
};
