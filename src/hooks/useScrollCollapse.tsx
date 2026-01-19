import { useState, useEffect, useCallback } from "react";

export function useScrollCollapse(threshold: number = 50) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    setScrollY(currentScrollY);
    setIsCollapsed(currentScrollY > threshold);
  }, [threshold]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Returns a value from 0 to 1 representing collapse progress
  const collapseProgress = Math.min(scrollY / threshold, 1);

  return { isCollapsed, collapseProgress, scrollY };
}
