import { useState, useEffect } from "react";

interface ScreenSize {
  isMobile: boolean;
  height: number;
  width: number;
}

/**
 * Custom hook to detect screen size and determine if the device is mobile
 * @param mobileBreakpoint - Width threshold for mobile devices in pixels (default: 768)
 * @returns Object containing isMobile flag and current screen width
 */
export function useScreenSize(mobileBreakpoint = 768): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    isMobile: false,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
    width: typeof window !== "undefined" ? window.innerWidth : 0,
  });

  useEffect(() => {
    const checkScreenSize = () => {
      const height = window.innerHeight;
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width < mobileBreakpoint,
        height,
        width,
      });
    };
    checkScreenSize();

    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, [mobileBreakpoint]);

  return screenSize;
}
