import { useState, useEffect, useCallback } from "react";
import { useScrollContainer } from "@/contexts/ScrollContainerContext";

export function useScrollCollapse(threshold: number = 50) {
  const containerRef = useScrollContainer();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [, forceUpdate] = useState(0);

  // Force update when container becomes available
  useEffect(() => {
    if (containerRef?.current) {
      forceUpdate(n => n + 1);
    }
  }, [containerRef?.current]);

  const handleScroll = useCallback(() => {
    const container = containerRef?.current;
    if (!container) return;
    
    const currentScrollY = container.scrollTop;
    setScrollY(currentScrollY);
    setIsCollapsed(currentScrollY > threshold);
  }, [containerRef, threshold]);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Call once to get initial state
    return () => container.removeEventListener("scroll", handleScroll);
  }, [containerRef?.current, handleScroll]);

  // Returns a value from 0 to 1 representing collapse progress
  const collapseProgress = Math.min(scrollY / threshold, 1);

  return { isCollapsed, collapseProgress, scrollY };
}
