import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const STORY_DURATION = 5000; // 5 seconds per story
  const PROGRESS_INTERVAL = 50;
  const MIN_SWIPE_DISTANCE = 50;

  // Filter only stories with content (not own story for now)
  const viewableStories = stories.filter(s => s.hasStory || s.isOwn);
  const currentStory = viewableStories[currentStoryIndex];

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStoryIndex(initialStoryIndex);
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
          // Move to next story
          if (currentStoryIndex < viewableStories.length - 1) {
            setCurrentStoryIndex(curr => curr + 1);
            return 0;
          } else {
            // End of all stories
            handleClose();
            return 100;
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
  }, [isOpen, isPaused, currentStoryIndex, viewableStories.length, isExiting]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 200);
  }, [onClose]);

  const goToNextStory = useCallback(() => {
    if (currentStoryIndex < viewableStories.length - 1) {
      setCurrentStoryIndex(curr => curr + 1);
      setProgress(0);
    } else {
      handleClose();
    }
  }, [currentStoryIndex, viewableStories.length, handleClose]);

  const goToPrevStory = useCallback(() => {
    if (progress > 20) {
      // Restart current story if more than 20% watched
      setProgress(0);
    } else if (currentStoryIndex > 0) {
      setCurrentStoryIndex(curr => curr - 1);
      setProgress(0);
    }
  }, [currentStoryIndex, progress]);

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

  if (!isOpen || !currentStory) return null;

  // Generate a random gradient for story background
  const gradients = [
    "from-purple-600 via-pink-500 to-orange-400",
    "from-blue-600 via-cyan-500 to-teal-400",
    "from-green-600 via-emerald-500 to-lime-400",
    "from-rose-600 via-red-500 to-orange-400",
    "from-indigo-600 via-violet-500 to-purple-400",
  ];
  const gradient = gradients[currentStoryIndex % gradients.length];

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
        <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <img 
                src={currentStory.avatar} 
                alt={currentStory.name}
                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white/30 object-cover"
              />
              <p className="text-2xl font-bold">{currentStory.name}</p>
              <p className="text-white/70 mt-2">Это демо-сторис</p>
            </div>
          </div>
        </div>

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-10 p-2 pt-3 flex gap-1">
          {viewableStories.map((_, index) => (
            <div 
              key={index} 
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div 
                className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                style={{ 
                  width: index < currentStoryIndex 
                    ? "100%" 
                    : index === currentStoryIndex 
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
            src={currentStory.avatar} 
            alt={currentStory.name}
            className="w-9 h-9 rounded-full border-2 border-white/50 object-cover"
          />
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{currentStory.name}</p>
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
        {currentStoryIndex > 0 && (
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
        {currentStoryIndex < viewableStories.length - 1 && (
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
