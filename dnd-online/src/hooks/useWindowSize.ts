import { useState, useEffect } from 'react';
import { debounce } from '../utils/helpers';

interface WindowSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Custom hook for tracking window dimensions and device type
 * @param mobileBreakpoint Mobile breakpoint in pixels (default: 768)
 * @param tabletBreakpoint Tablet breakpoint in pixels (default: 1024)
 * @returns Window size and device type information
 */
export const useWindowSize = (
  mobileBreakpoint: number = 768,
  tabletBreakpoint: number = 1024
): WindowSize => {
  // Initialize with default values for SSR
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Function to update window size
    const updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({
        width,
        height,
        isMobile: width < mobileBreakpoint,
        isTablet: width >= mobileBreakpoint && width < tabletBreakpoint,
        isDesktop: width >= tabletBreakpoint,
      });
    };

    // Initial update
    updateSize();

    // Debounced resize handler
    const handleResize = debounce(updateSize, 100);

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileBreakpoint, tabletBreakpoint]);

  return windowSize;
};
