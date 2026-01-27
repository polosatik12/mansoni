
# Plan: Smoother Story Circle Animations

## Problem Analysis

Currently, the story circles animation is janky because:
1. JavaScript recalculates all styles on every scroll event (60+ times per second)
2. No CSS transitions smooth out the frame-to-frame changes
3. The `useMemo` dependency on `collapseProgress` causes recalculation on every scroll tick
4. Multiple inline style updates per frame trigger layout thrashing

## Solution Strategy

Switch from **per-frame JavaScript calculations** to **CSS-driven transitions** with only minimal JavaScript for state changes. This lets the browser's compositor handle smooth interpolation.

## Implementation Details

### 1. Add CSS Transitions to Story Elements

Update `src/index.css` to add smooth transitions:

```css
/* Story avatar button - smooth transitions */
.story-avatar-btn {
  will-change: transform, opacity;
  transform: translateZ(0);
  transition: transform 0.2s cubic-bezier(0.25, 0.1, 0.25, 1),
              opacity 0.15s ease-out;
}

/* Story avatar container - smooth scale */
.story-avatar {
  will-change: transform;
  transform: translateZ(0);
  transition: transform 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
}

/* Story name - smooth fade */
.story-name {
  will-change: opacity, height;
  transition: opacity 0.15s ease-out, 
              height 0.15s ease-out, 
              margin-top 0.15s ease-out;
}
```

### 2. Simplify FeedHeader Logic

Update `src/components/feed/FeedHeader.tsx`:

- **Reduce recalculation frequency**: Only update on significant progress changes (threshold-based)
- **Use `requestAnimationFrame` batching**: Group style updates
- **Simplify state transitions**: Use two states (expanded/collapsed) with CSS handling the animation
- **Add transition classes** instead of inline transition styles

### 3. Optimize useScrollCollapse Hook

Update `src/hooks/useScrollCollapse.tsx`:

- Add **hysteresis/debouncing** to prevent jitter at scroll boundaries
- Use **rounded progress values** (e.g., 2 decimal places) to reduce unnecessary re-renders
- Consider using CSS `scroll-timeline` for native browser scroll-linked animations (with fallback)

### 4. Optimize ChatStories Component

Update `src/components/chat/ChatStories.tsx`:

- Apply the same transition-based approach
- Ensure consistent animation timing between FeedHeader and ChatStories

## Technical Details

### CSS Easing Curve
Use `cubic-bezier(0.25, 0.1, 0.25, 1)` - a slightly modified ease-out that feels natural for scroll-linked UI

### Transition Duration
- Position/transform: 200ms (fast enough to feel responsive)
- Opacity: 150ms (slightly faster for snappier visibility changes)
- Scale: 200ms (matches position for coordinated movement)

### GPU Optimization
- Keep `will-change: transform, opacity` on animated elements
- Use `transform: translate3d()` and `scale()` only
- Avoid animating `width`, `height`, `left`, `top` properties

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Add/update transition styles for `.story-avatar-btn`, `.story-avatar`, `.story-name` |
| `src/components/feed/FeedHeader.tsx` | Simplify style calculations, add transition classes |
| `src/hooks/useScrollCollapse.tsx` | Add progress value rounding/debouncing |
| `src/components/chat/ChatStories.tsx` | Apply same transition approach for consistency |

## Expected Result

- Smooth 60fps animations when scrolling
- No visible jankiness or stuttering
- Consistent behavior across different scroll speeds
- Proper GPU acceleration maintaining battery efficiency
