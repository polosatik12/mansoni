import { useState, useEffect } from "react";
import { useScrollContainer } from "@/contexts/ScrollContainerContext";

export function useScrollCollapse(threshold: number = 50) {
  const containerRef = useScrollContainer();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollY = container.scrollTop;
      setScrollY(currentScrollY);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Get initial state
    
    return () => container.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  const isCollapsed = scrollY > threshold;
  const collapseProgress = Math.min(scrollY / threshold, 1);

  return { isCollapsed, collapseProgress, scrollY };
}
