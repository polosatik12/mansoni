import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseSwipeBackOptions {
  edgeWidth?: number;
  threshold?: number;
  enabled?: boolean;
}

export function useSwipeBack(options: UseSwipeBackOptions = {}) {
  const { edgeWidth = 24, threshold = 80, enabled = true } = options;
  const navigate = useNavigate();
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const isEdgeSwipe = useRef(false);
  const overlay = useRef<HTMLDivElement | null>(null);

  const createOverlay = useCallback(() => {
    if (overlay.current) return;
    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      pointer-events: none;
      background: linear-gradient(to right, rgba(0,0,0,0.08) 0%, transparent 40%);
      opacity: 0; transition: opacity 0.15s;
    `;
    document.body.appendChild(el);
    overlay.current = el;
  }, []);

  const removeOverlay = useCallback(() => {
    if (overlay.current) {
      overlay.current.remove();
      overlay.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      if (x > edgeWidth) return;
      startX.current = x;
      startY.current = e.touches[0].clientY;
      currentX.current = x;
      isEdgeSwipe.current = true;
      createOverlay();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isEdgeSwipe.current) return;
      currentX.current = e.touches[0].clientX;
      const dx = currentX.current - startX.current;
      const dy = Math.abs(e.touches[0].clientY - startY.current);

      // Cancel if vertical scroll is dominant
      if (dy > dx && dx < 20) {
        isEdgeSwipe.current = false;
        removeOverlay();
        return;
      }

      if (dx > 10) {
        e.preventDefault();
        if (overlay.current) {
          const progress = Math.min(dx / threshold, 1);
          overlay.current.style.opacity = String(progress);
        }
      }
    };

    const onTouchEnd = () => {
      if (!isEdgeSwipe.current) return;
      const dx = currentX.current - startX.current;
      isEdgeSwipe.current = false;
      removeOverlay();

      if (dx >= threshold && window.history.length > 1) {
        navigate(-1);
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      removeOverlay();
    };
  }, [enabled, edgeWidth, threshold, navigate, createOverlay, removeOverlay]);
}
