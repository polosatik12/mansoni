import { useState, useEffect, useRef, useCallback } from "react";
import { useScrollContainer } from "@/contexts/ScrollContainerContext";

export function useScrollCollapse(threshold: number = 50) {
  const containerRef = useScrollContainer();
  const [collapseProgress, setCollapseProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const rafId = useRef<number | null>(null);
  const lastScrollY = useRef(0);

  const updateScroll = useCallback(() => {
    const currentScrollY = lastScrollY.current;
    const progress = Math.min(Math.max(currentScrollY / threshold, 0), 1);
    
    setCollapseProgress(progress);
    setScrollY(currentScrollY);
    rafId.current = null;
  }, [threshold]);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const handleScroll = () => {
      lastScrollY.current = container.scrollTop;
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(updateScroll);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [containerRef, updateScroll]);

  const isCollapsed = collapseProgress > 0.5;

  return { isCollapsed, collapseProgress, scrollY };
}
