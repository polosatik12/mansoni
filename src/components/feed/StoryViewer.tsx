import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { X, Rewind, FastForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStories, type UserWithStories } from "@/hooks/useStories";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface StoryViewerProps {
  usersWithStories: UserWithStories[];
  initialUserIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function StoryViewer({ usersWithStories, initialUserIndex, isOpen, onClose }: StoryViewerProps) {
  const { markAsViewed } = useStories();
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryInUser, setCurrentStoryInUser] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  
  // Long press state for speed controls
  const [showSpeedControls, setShowSpeedControls] = useState(false);
  const [isRewinding, setIsRewinding] = useState(false);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const speedIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);

  const STORY_DURATION = 5000;
  const PROGRESS_INTERVAL = 50;
  const MIN_SWIPE_DISTANCE = 50;
  const LONG_PRESS_DURATION = 2000; // 2 seconds for long press
  const SPEED_MULTIPLIER = 3; // 3x speed for fast forward/rewind

  // Stabilize activeUsers with useMemo to prevent reset on every render
  const activeUsers = useMemo(
    () => usersWithStories.filter(u => u.stories.length > 0),
    [usersWithStories]
  );
  const currentUser = activeUsers[currentUserIndex];
  const currentUserStories = currentUser?.stories || [];
  const totalStoriesForUser = currentUserStories.length;

  // Reset only when opening (not on every render)
  useEffect(() => {
    if (isOpen && !hasInitialized.current) {
      hasInitialized.current = true;
      const targetUser = usersWithStories[initialUserIndex];
      const activeIndex = activeUsers.findIndex(u => u.user_id === targetUser?.user_id);
      setCurrentUserIndex(activeIndex >= 0 ? activeIndex : 0);
      setCurrentStoryInUser(0);
      setProgress(0);
      setIsExiting(false);
      setIsEntering(true);
      setSlideDirection(null);
      // Remove entering state after animation
      setTimeout(() => setIsEntering(false), 300);
    }
    if (!isOpen) {
      hasInitialized.current = false;
      setShowSpeedControls(false);
      setIsRewinding(false);
      setIsFastForwarding(false);
    }
  }, [isOpen, initialUserIndex, usersWithStories, activeUsers]);

  // Mark story as viewed
  useEffect(() => {
    if (isOpen && currentUser && currentUserStories[currentStoryInUser]) {
      markAsViewed(currentUserStories[currentStoryInUser].id);
    }
  }, [isOpen, currentUser, currentStoryInUser, currentUserStories, markAsViewed]);

  // Progress timer with speed adjustment
  useEffect(() => {
    if (!isOpen || isPaused || isExiting || showSpeedControls) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      return;
    }

    const speedMultiplier = isFastForwarding ? SPEED_MULTIPLIER : isRewinding ? -SPEED_MULTIPLIER : 1;

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        const delta = (100 / (STORY_DURATION / PROGRESS_INTERVAL)) * speedMultiplier;
        const newProgress = prev + delta;
        
        if (newProgress >= 100) {
          if (currentStoryInUser < totalStoriesForUser - 1) {
            setCurrentStoryInUser(curr => curr + 1);
            return 0;
          } else {
            if (currentUserIndex < activeUsers.length - 1) {
              setCurrentUserIndex(curr => curr + 1);
              setCurrentStoryInUser(0);
              return 0;
            } else {
              handleClose();
              return 100;
            }
          }
        }
        
        if (newProgress <= 0) {
          if (currentStoryInUser > 0) {
            setCurrentStoryInUser(curr => curr - 1);
            return 100;
          } else if (currentUserIndex > 0) {
            const prevUser = activeUsers[currentUserIndex - 1];
            setCurrentUserIndex(curr => curr - 1);
            setCurrentStoryInUser(prevUser.stories.length - 1);
            return 100;
          }
          return 0;
        }
        
        return newProgress;
      });
    }, PROGRESS_INTERVAL);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isOpen, isPaused, currentUserIndex, currentStoryInUser, totalStoriesForUser, activeUsers.length, isExiting, showSpeedControls, isFastForwarding, isRewinding]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  }, [onClose]);

  const goToNextStory = useCallback(() => {
    setSlideDirection('left');
    setTimeout(() => {
      if (currentStoryInUser < totalStoriesForUser - 1) {
        setCurrentStoryInUser(curr => curr + 1);
        setProgress(0);
      } else {
        if (currentUserIndex < activeUsers.length - 1) {
          setCurrentUserIndex(curr => curr + 1);
          setCurrentStoryInUser(0);
          setProgress(0);
        } else {
          handleClose();
          return;
        }
      }
      setTimeout(() => setSlideDirection(null), 300);
    }, 150);
  }, [currentStoryInUser, totalStoriesForUser, currentUserIndex, activeUsers.length, handleClose]);

  const goToPrevStory = useCallback(() => {
    setSlideDirection('right');
    setTimeout(() => {
      if (progress > 20 || currentStoryInUser > 0) {
        if (currentStoryInUser > 0 && progress <= 20) {
          setCurrentStoryInUser(curr => curr - 1);
        }
        setProgress(0);
      } else if (currentUserIndex > 0) {
        const prevUserIndex = currentUserIndex - 1;
        const prevUser = activeUsers[prevUserIndex];
        setCurrentUserIndex(prevUserIndex);
        setCurrentStoryInUser(prevUser.stories.length - 1);
        setProgress(0);
      }
      setTimeout(() => setSlideDirection(null), 300);
    }, 150);
  }, [currentUserIndex, currentStoryInUser, progress, activeUsers]);

  // Long press handlers
  const startLongPress = useCallback(() => {
    setIsPaused(true);
    longPressTimer.current = setTimeout(() => {
      setShowSpeedControls(true);
    }, LONG_PRESS_DURATION);
  }, []);

  const endLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsPaused(false);
    setShowSpeedControls(false);
    setIsRewinding(false);
    setIsFastForwarding(false);
    
    if (speedIntervalRef.current) {
      clearInterval(speedIntervalRef.current);
      speedIntervalRef.current = null;
    }
  }, []);

  // Speed control handlers
  const startRewind = useCallback(() => {
    setIsRewinding(true);
    setIsFastForwarding(false);
    
    // Speed up video if it's a video story
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5;
    }
    
    speedIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (STORY_DURATION / PROGRESS_INTERVAL)) * SPEED_MULTIPLIER;
        if (newProgress <= 0) {
          if (currentStoryInUser > 0) {
            setCurrentStoryInUser(curr => curr - 1);
            return 100;
          }
          return 0;
        }
        return newProgress;
      });
    }, PROGRESS_INTERVAL);
  }, [currentStoryInUser]);

  const startFastForward = useCallback(() => {
    setIsFastForwarding(true);
    setIsRewinding(false);
    
    // Speed up video if it's a video story
    if (videoRef.current) {
      videoRef.current.playbackRate = 3;
    }
    
    speedIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (STORY_DURATION / PROGRESS_INTERVAL)) * SPEED_MULTIPLIER;
        if (newProgress >= 100) {
          if (currentStoryInUser < totalStoriesForUser - 1) {
            setCurrentStoryInUser(curr => curr + 1);
            return 0;
          } else if (currentUserIndex < activeUsers.length - 1) {
            setCurrentUserIndex(curr => curr + 1);
            setCurrentStoryInUser(0);
            return 0;
          }
          return 100;
        }
        return newProgress;
      });
    }, PROGRESS_INTERVAL);
  }, [currentStoryInUser, totalStoriesForUser, currentUserIndex, activeUsers.length]);

  const stopSpeedControl = useCallback(() => {
    setIsRewinding(false);
    setIsFastForwarding(false);
    
    if (videoRef.current) {
      videoRef.current.playbackRate = 1;
    }
    
    if (speedIntervalRef.current) {
      clearInterval(speedIntervalRef.current);
      speedIntervalRef.current = null;
    }
  }, []);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    startLongPress();
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    // Cancel long press if user is swiping
    if (touchStart && Math.abs(e.targetTouches[0].clientX - touchStart) > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const onTouchEnd = () => {
    endLongPress();
    
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE;
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE;

    if (isLeftSwipe && !showSpeedControls) {
      goToNextStory();
    } else if (isRightSwipe && !showSpeedControls) {
      goToPrevStory();
    }
  };

  // Handle tap on left/right side
  const handleTap = useCallback((e: React.MouseEvent) => {
    // Don't navigate if clicking on close button area or speed controls
    if ((e.target as HTMLElement).closest('button')) return;
    if (showSpeedControls) return;
    
    const screenWidth = window.innerWidth;
    const tapX = e.clientX;
    
    // Left half = previous, Right half = next
    if (tapX < screenWidth / 2) {
      goToPrevStory();
    } else {
      goToNextStory();
    }
  }, [goToPrevStory, goToNextStory, showSpeedControls]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevStory();
      } else if (e.key === "ArrowRight") {
        goToNextStory();
      } else if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToNextStory, goToPrevStory, handleClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      if (speedIntervalRef.current) clearInterval(speedIntervalRef.current);
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  if (!isOpen || !currentUser || currentUserStories.length === 0) return null;

  const currentStory = currentUserStories[currentStoryInUser];
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: false, locale: ru });
    } catch {
      return '';
    }
  })();

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 bg-black flex items-center justify-center",
        "transition-all duration-300 ease-out",
        isEntering && "opacity-0 scale-110",
        isExiting && "opacity-0 scale-95",
        !isEntering && !isExiting && "opacity-100 scale-100"
      )}
    >
      {/* Story content */}
      <div
        className={cn(
          "relative w-full h-full max-w-md mx-auto overflow-hidden",
          "transition-all duration-300 ease-out",
          slideDirection === 'left' && "translate-x-[-10%] opacity-80",
          slideDirection === 'right' && "translate-x-[10%] opacity-80",
          !slideDirection && "translate-x-0 opacity-100"
        )}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Tap zones for navigation - below header, no focus styles */}
        <button
          type="button"
          className="absolute left-0 top-16 w-1/2 h-[calc(100%-4rem)] z-10 bg-transparent border-0 outline-none focus:outline-none focus-visible:outline-none ring-0 appearance-none cursor-default"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          onClick={goToPrevStory}
          aria-label="Previous story"
        />
        <button
          type="button"
          className="absolute right-0 top-16 w-1/2 h-[calc(100%-4rem)] z-10 bg-transparent border-0 outline-none focus:outline-none focus-visible:outline-none ring-0 appearance-none cursor-default"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          onClick={goToNextStory}
          aria-label="Next story"
        />

        {/* Story image/video */}
        <div className={cn(
          "absolute inset-0 pointer-events-none transition-transform duration-300 ease-out",
          slideDirection === 'left' && "scale-[0.95]",
          slideDirection === 'right' && "scale-[0.95]"
        )}>
          {currentStory.media_type === 'video' ? (
            <video 
              ref={videoRef}
              src={currentStory.media_url}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
          ) : (
            <img 
              src={currentStory.media_url} 
              alt={`${currentUser.display_name}'s story`}
              className={cn(
                "w-full h-full object-cover transition-all duration-500 ease-out",
                isEntering && "scale-110 blur-sm",
                !isEntering && "scale-100 blur-0"
              )}
            />
          )}
          {/* Subtle overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        </div>

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-10 p-2 pt-3 flex gap-1">
          {currentUserStories.map((_, index) => (
            <div 
              key={index} 
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div 
                className={cn(
                  "h-full bg-white rounded-full",
                  "transition-all ease-linear",
                  (isRewinding || isFastForwarding) ? "duration-0" : "duration-100"
                )}
                style={{ 
                  width: index < currentStoryInUser 
                    ? "100%" 
                    : index === currentStoryInUser 
                      ? `${progress}%` 
                      : "0%" 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header with user info - higher z-index than nav zones */}
        <div className={cn(
          "absolute top-6 left-0 right-0 z-30 px-3 flex items-center gap-3",
          "transition-all duration-300 ease-out",
          isEntering && "opacity-0 translate-y-[-20px]",
          !isEntering && "opacity-100 translate-y-0"
        )}>
          <img 
            src={currentUser.avatar_url || `https://i.pravatar.cc/150?u=${currentUser.user_id}`} 
            alt={currentUser.display_name || ''}
            className="w-9 h-9 rounded-full border-2 border-white/50 object-cover"
          />
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">
              {currentUser.isOwn ? 'Вы' : currentUser.display_name}
            </p>
            <p className="text-white/60 text-xs">{timeAgo} назад</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Speed controls - appear after long press */}
        <div className={cn(
          "absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 flex justify-between px-4",
          "transition-all duration-300 ease-out pointer-events-none",
          showSpeedControls ? "opacity-100" : "opacity-0"
        )}>
          {/* Rewind button */}
          <button
            className={cn(
              "pointer-events-auto w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm",
              "flex items-center justify-center",
              "transition-all duration-200 ease-out",
              "active:scale-90 active:bg-white/20",
              isRewinding && "bg-white/30 scale-110"
            )}
            onTouchStart={(e) => {
              e.stopPropagation();
              startRewind();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              stopSpeedControl();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              startRewind();
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              stopSpeedControl();
            }}
            onMouseLeave={stopSpeedControl}
          >
            <Rewind className={cn(
              "w-8 h-8 text-white transition-transform duration-200",
              isRewinding && "scale-125"
            )} />
          </button>

          {/* Fast forward button */}
          <button
            className={cn(
              "pointer-events-auto w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm",
              "flex items-center justify-center",
              "transition-all duration-200 ease-out",
              "active:scale-90 active:bg-white/20",
              isFastForwarding && "bg-white/30 scale-110"
            )}
            onTouchStart={(e) => {
              e.stopPropagation();
              startFastForward();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              stopSpeedControl();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              startFastForward();
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              stopSpeedControl();
            }}
            onMouseLeave={stopSpeedControl}
          >
            <FastForward className={cn(
              "w-8 h-8 text-white transition-transform duration-200",
              isFastForwarding && "scale-125"
            )} />
          </button>
        </div>

        {/* Speed indicator */}
        {(isRewinding || isFastForwarding) && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 animate-pulse">
              <span className="text-white font-semibold text-lg">
                {isRewinding ? '◀◀ 3x' : '▶▶ 3x'}
              </span>
            </div>
          </div>
        )}

        {/* Caption */}
        {currentStory.caption && (
          <div className={cn(
            "absolute bottom-20 left-0 right-0 z-10 px-4",
            "transition-all duration-300 ease-out",
            isEntering && "opacity-0 translate-y-[20px]",
            !isEntering && "opacity-100 translate-y-0"
          )}>
            <p className="text-white text-sm text-center">{currentStory.caption}</p>
          </div>
        )}

        {/* Long press hint */}
        {isPaused && !showSpeedControls && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
              <span className="text-white/80 text-sm">Удерживайте для перемотки...</span>
            </div>
          </div>
        )}

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
    </div>
  );
}
