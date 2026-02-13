import { useState, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useScrollContainer } from "@/contexts/ScrollContainerContext";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
}

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const scrollContainerRef = useScrollContainer();
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);

  const threshold = 80;
  const maxPull = 140;

  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollContainer = scrollContainerRef?.current;
    if (scrollContainer && scrollContainer.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      // Rubber-band resistance effect
      const resistance = 1 - Math.min(diff / 600, 0.6);
      const distance = Math.min(diff * resistance * 0.5, maxPull);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (!pulling) return;
    
    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      setPullDistance(60);
      
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    
    setPulling(false);
  };

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center",
          "transition-opacity duration-200",
          pullDistance > 0 || refreshing ? "opacity-100" : "opacity-0"
        )}
        style={{ top: Math.max(pullDistance - 50, 8) }}
      >
        <div
          className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center",
            "shadow-[0_0_20px_rgba(0,163,180,0.3)] border border-white/15",
            "backdrop-blur-xl"
          )}
          style={{
            background: 'linear-gradient(135deg, rgba(0,163,180,0.25) 0%, rgba(0,102,204,0.25) 50%, rgba(0,200,150,0.25) 100%)',
          }}
        >
          {/* Custom spinner SVG */}
          <svg
            className={cn(refreshing && "animate-spin")}
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              transform: refreshing ? undefined : `rotate(${progress * 270}deg)`,
              transition: pulling ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2.5"
              fill="none"
            />
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="url(#pullGrad)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${progress * 56.5} 56.5`}
              style={{
                transition: pulling ? 'none' : 'stroke-dasharray 0.3s ease-out',
              }}
            />
            <defs>
              <linearGradient id="pullGrad" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#00A3B4" />
                <stop offset="50%" stopColor="#0066CC" />
                <stop offset="100%" stopColor="#00C896" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {children}
    </div>
  );
}
