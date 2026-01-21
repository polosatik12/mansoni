import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Import story content images
import storyContent1 from "@/assets/story-content-1.jpg";
import storyContent2 from "@/assets/story-content-2.jpg";
import storyContent3 from "@/assets/story-content-3.jpg";
import storyContent4 from "@/assets/story-content-4.jpg";
import storyContent5 from "@/assets/story-content-5.jpg";

// Each user has 1-3 stories
const userStoryContents: Record<string, string[]> = {
  "you": [storyContent1],
  "1": [storyContent3, storyContent1],
  "2": [storyContent2],
  "3": [storyContent4, storyContent5, storyContent2],
  "5": [storyContent5, storyContent3],
};

interface Story {
  id: string;
  name: string;
  avatar: string;
  isOwn?: boolean;
  hasStory?: boolean;
}

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function StoryViewer({ stories, initialStoryIndex, isOpen, onClose }: StoryViewerProps) {
  const [currentUserIndex, setCurrentUserIndex] = useState(initialStoryIndex);
  const [currentStoryInUser, setCurrentStoryInUser] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const STORY_DURATION = 5000; // 5 seconds per story
  const PROGRESS_INTERVAL = 50;
  const MIN_SWIPE_DISTANCE = 50;

  // Filter only users with stories
  const usersWithStories = stories.filter(s => s.hasStory || s.isOwn);
  const currentUser = usersWithStories[currentUserIndex];
  
  // Get stories for current user
  const currentUserStories = currentUser ? (userStoryContents[currentUser.id] || [storyContent1]) : [];
  const totalStoriesForUser = currentUserStories.length;

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentUserIndex(initialStoryIndex);
      setCurrentStoryInUser(0);
      setProgress(0);
      setIsExiting(false);
    }
  }, [isOpen, initialStoryIndex]);

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
          // Move to next story within user
          if (currentStoryInUser < totalStoriesForUser - 1) {
            setCurrentStoryInUser(curr => curr + 1);
            return 0;
          } else {
            // Move to next user
            if (currentUserIndex < usersWithStories.length - 1) {
              setCurrentUserIndex(curr => curr + 1);
              setCurrentStoryInUser(0);
              return 0;
            } else {
              // End of all stories
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
  }, [isOpen, isPaused, currentUserIndex, currentStoryInUser, totalStoriesForUser, usersWithStories.length, isExiting]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 200);
  }, [onClose]);

  const goToNextStory = useCallback(() => {
    // If there are more stories for this user
    if (currentStoryInUser < totalStoriesForUser - 1) {
      setCurrentStoryInUser(curr => curr + 1);
      setProgress(0);
    } else {
      // Move to next user
      if (currentUserIndex < usersWithStories.length - 1) {
        setCurrentUserIndex(curr => curr + 1);
        setCurrentStoryInUser(0);
        setProgress(0);
      } else {
        handleClose();
      }
    }
  }, [currentStoryInUser, totalStoriesForUser, currentUserIndex, usersWithStories.length, handleClose]);

  const goToPrevStory = useCallback(() => {
    if (progress > 20 || currentStoryInUser > 0) {
      // Go to previous story within user or restart current
      if (currentStoryInUser > 0 && progress <= 20) {
        setCurrentStoryInUser(curr => curr - 1);
      }
      setProgress(0);
    } else if (currentUserIndex > 0) {
      // Go to previous user's last story
      const prevUserIndex = currentUserIndex - 1;
      const prevUser = usersWithStories[prevUserIndex];
      const prevUserStories = userStoryContents[prevUser.id] || [storyContent1];
      setCurrentUserIndex(prevUserIndex);
      setCurrentStoryInUser(prevUserStories.length - 1);
      setProgress(0);
    }
  }, [currentUserIndex, currentStoryInUser, progress, usersWithStories]);

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
  const handleTap = (e: React.MouseEvent) => {
    const screenWidth = window.innerWidth;
    const tapX = e.clientX;
    
    if (tapX < screenWidth / 3) {
      goToPrevStory();
    } else if (tapX > (screenWidth * 2) / 3) {
      goToNextStory();
    }
  };

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

  if (!isOpen || !currentUser) return null;

  const currentImage = currentUserStories[currentStoryInUser] || storyContent1;

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
        onClick={handleTap}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Story image/background */}
        <div className="absolute inset-0">
          <img 
            src={currentImage} 
            alt={`${currentUser.name}'s story`}
            className="w-full h-full object-cover"
          />
          {/* Subtle overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        </div>

        {/* Progress bars - only for current user's stories */}
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

        {/* Header with user info */}
        <div className="absolute top-6 left-0 right-0 z-10 px-3 flex items-center gap-3">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name}
            className="w-9 h-9 rounded-full border-2 border-white/50 object-cover"
          />
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{currentUser.name}</p>
            <p className="text-white/60 text-xs">2ч назад</p>
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

        {/* Navigation arrows for desktop */}
        {(currentUserIndex > 0 || currentStoryInUser > 0) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevStory();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors hidden sm:block"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {(currentUserIndex < usersWithStories.length - 1 || currentStoryInUser < totalStoriesForUser - 1) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNextStory();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors hidden sm:block"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
    </div>
  );
}
