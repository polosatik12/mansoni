import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { X } from "lucide-react";
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
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);

  const STORY_DURATION = 5000;
  const PROGRESS_INTERVAL = 50;
  const MIN_SWIPE_DISTANCE = 50;

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
    }
    if (!isOpen) {
      hasInitialized.current = false;
    }
  }, [isOpen, initialUserIndex, usersWithStories, activeUsers]);

  // Mark story as viewed
  useEffect(() => {
    if (isOpen && currentUser && currentUserStories[currentStoryInUser]) {
      markAsViewed(currentUserStories[currentStoryInUser].id);
    }
  }, [isOpen, currentUser, currentStoryInUser, currentUserStories, markAsViewed]);

  // Progress timer
  useEffect(() => {
    if (!isOpen || isPaused || isExiting) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      return;
    }

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (STORY_DURATION / PROGRESS_INTERVAL));
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
        return newProgress;
      });
    }, PROGRESS_INTERVAL);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isOpen, isPaused, currentUserIndex, currentStoryInUser, totalStoriesForUser, activeUsers.length, isExiting]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 200);
  }, [onClose]);

  const goToNextStory = useCallback(() => {
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
      }
    }
  }, [currentStoryInUser, totalStoriesForUser, currentUserIndex, activeUsers.length, handleClose]);

  const goToPrevStory = useCallback(() => {
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
  }, [currentUserIndex, currentStoryInUser, progress, activeUsers]);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    setIsPaused(false);
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE;
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE;

    if (isLeftSwipe) {
      goToNextStory();
    } else if (isRightSwipe) {
      goToPrevStory();
    }
  };

  // Handle tap on left/right side
  const handleTap = useCallback((e: React.MouseEvent) => {
    // Don't navigate if clicking on close button area
    if ((e.target as HTMLElement).closest('button')) return;
    
    const screenWidth = window.innerWidth;
    const tapX = e.clientX;
    
    // Left half = previous, Right half = next
    if (tapX < screenWidth / 2) {
      goToPrevStory();
    } else {
      goToNextStory();
    }
  }, [goToPrevStory, goToNextStory]);

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
        "fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-200",
        isExiting ? "opacity-0" : "opacity-100"
      )}
    >
      {/* Story content */}
      <div
        className={cn(
          "relative w-full h-full max-w-md mx-auto overflow-hidden transition-transform duration-200",
          isExiting ? "scale-95" : "scale-100"
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
        <div className="absolute inset-0 pointer-events-none">
          {currentStory.media_type === 'video' ? (
            <video 
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
              className="w-full h-full object-cover"
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
                className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
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
        <div className="absolute top-6 left-0 right-0 z-30 px-3 flex items-center gap-3">
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

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-20 left-0 right-0 z-10 px-4">
            <p className="text-white text-sm text-center">{currentStory.caption}</p>
          </div>
        )}


        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
    </div>
  );
}
