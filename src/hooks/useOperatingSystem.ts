import { useState, useEffect } from 'react';

type OperatingSystem = 'windows' | 'macos' | 'linux' | 'unknown';

/**
 * Hook to detect the user's operating system
 * @returns The detected operating system: 'windows', 'macos', 'linux', or 'unknown'
 */
export function useOperatingSystem(): OperatingSystem {
  const [os, setOs] = useState<OperatingSystem>('unknown');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('win')) {
      setOs('windows');
    } else if (userAgent.includes('mac')) {
      setOs('macos');
    } else if (userAgent.includes('linux') || userAgent.includes('x11')) {
      setOs('linux');
    }
  }, []);

  return os;
} 