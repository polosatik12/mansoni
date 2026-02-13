import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Heart, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStories, type UserWithStories } from "@/hooks/useStories";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useChatOpen } from "@/contexts/ChatOpenContext";
import { useNavigate } from "react-router-dom";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { StoryShareSheet } from "./StoryShareSheet";

interface StoryViewerProps {
  usersWithStories: UserWithStories[];
  initialUserIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function StoryViewer({ usersWithStories, initialUserIndex, isOpen, onClose }: StoryViewerProps) {
  const { markAsViewed, deleteStory } = useStories();
  const { setIsStoryOpen } = useChatOpen();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryInUser, setCurrentStoryInUser] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [liked, setLiked] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const replyInputRef = useRef<HTMLInputElement>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);

  const STORY_DURATION = 5000;
  const PROGRESS_INTERVAL = 50;
  const MIN_SWIPE_DISTANCE = 50;

  // Sync story open state with context for hiding BottomNav
  useEffect(() => {
    setIsStoryOpen(isOpen);
    return () => setIsStoryOpen(false);
  }, [isOpen, setIsStoryOpen]);

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
    if (!isOpen || isPaused) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      return;
    }

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        const delta = 100 / (STORY_DURATION / PROGRESS_INTERVAL);
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
              onClose();
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
  }, [isOpen, isPaused, currentUserIndex, currentStoryInUser, totalStoriesForUser, activeUsers.length, onClose]);

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
        onClose();
      }
    }
  }, [currentStoryInUser, totalStoriesForUser, currentUserIndex, activeUsers.length, onClose]);

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

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevStory();
      } else if (e.key === "ArrowRight") {
        goToNextStory();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToNextStory, goToPrevStory, onClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  // Reset reply state when story/user changes
  useEffect(() => {
    setReplyText("");
    setLiked(false);
    setShowDeleteConfirm(false);
  }, [currentUserIndex, currentStoryInUser]);

  const isOwnStory = currentUser && currentUser.isOwn;
  const isOtherUser = currentUser && !currentUser.isOwn;

  const sendStoryReply = useCallback(async () => {
    if (!user || !currentUser || !replyText.trim() || sendingReply) return;

    setSendingReply(true);
    setIsPaused(true);
    try {
      const { data: convData, error: convError } = await supabase
        .rpc('get_or_create_dm', { target_user_id: currentUser.user_id });

      if (convError) {
        console.error("[StoryReply] RPC error:", convError);
        throw convError;
      }

      const conversationId = convData;
      const activeStory = currentUserStories[currentStoryInUser];

      const insertPayload = {
        conversation_id: conversationId,
        sender_id: user.id,
        content: replyText.trim(),
        shared_story_id: activeStory?.id || null,
      };

      const { error: msgError } = await supabase
        .from("messages")
        .insert(insertPayload as any)
        .select() as any;

      if (msgError) throw msgError;

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      setReplyText("");
      toast.success(`Отправлено в чат с ${currentUser.display_name}`);
    } catch (err: any) {
      console.error("[StoryReply] Error:", err);
      toast.error(`Ошибка: ${err?.message || 'Неизвестная ошибка'}`);
    } finally {
      setSendingReply(false);
      setIsPaused(false);
    }
  }, [user, currentUser, replyText, sendingReply, currentUserStories, currentStoryInUser]);

  // Clamp index to valid range when stories array changes (e.g. after deletion)
  const safeStoryIndex = Math.min(currentStoryInUser, currentUserStories.length - 1);
  
  if (!isOpen || !currentUser || currentUserStories.length === 0) return null;

  const currentStory = currentUserStories[safeStoryIndex];
  if (!currentStory) return null;
  
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: false, locale: ru });
    } catch {
      return '';
    }
  })();

  const handleDeleteStory = async () => {
    if (!currentStory || deleting) return;
    setDeleting(true);
    setIsPaused(true);
    try {
      await deleteStory(currentStory.id);
      toast.success("История удалена");
      if (totalStoriesForUser <= 1) {
        onClose();
      } else if (currentStoryInUser >= totalStoriesForUser - 1) {
        setCurrentStoryInUser(prev => Math.max(0, prev - 1));
        setProgress(0);
      } else {
        setProgress(0);
      }
      setShowDeleteConfirm(false);
    } catch {
      toast.error("Ошибка удаления");
    } finally {
      setDeleting(false);
      setIsPaused(false);
    }
  };



  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
      {/* Story content */}
      <div
        className="relative w-full h-full max-w-md mx-auto overflow-hidden flex flex-col"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Tap zones for navigation */}
        <button
          type="button"
          className="absolute left-0 top-16 w-1/2 h-[calc(100%-8rem)] z-10 bg-transparent border-0 outline-none focus:outline-none focus-visible:outline-none ring-0 appearance-none cursor-default"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          onClick={goToPrevStory}
          aria-label="Previous story"
        />
        <button
          type="button"
          className="absolute right-0 top-16 w-1/2 h-[calc(100%-8rem)] z-10 bg-transparent border-0 outline-none focus:outline-none focus-visible:outline-none ring-0 appearance-none cursor-default"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          onClick={goToNextStory}
          aria-label="Next story"
        />

        {/* Story image/video */}
        <div className="absolute inset-0 pointer-events-none bg-black">
          {currentStory.media_type === 'video' ? (
            <video 
              ref={videoRef}
              src={currentStory.media_url}
              className="w-full h-full object-contain"
              autoPlay
              muted
              playsInline
            />
          ) : (
            <img 
              src={currentStory.media_url} 
              alt={`${currentUser.display_name}'s story`}
              className="w-full h-full object-contain"
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
                className="h-full bg-white rounded-full transition-all ease-linear duration-100"
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
        <div className="absolute top-6 left-0 right-0 z-30 px-3 flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
            onClick={(e) => {
              e.stopPropagation();
              const targetId = currentUser.user_id;
              if (!targetId) return;
              onClose();
              navigate(`/user/${targetId}`);
            }}
            aria-label="Open profile"
          >
            <img 
              src={currentUser.avatar_url || `https://i.pravatar.cc/150?u=${currentUser.user_id}`} 
              alt={currentUser.display_name || ''}
              className="w-9 h-9 rounded-full border-2 border-white/50 object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-white font-semibold text-sm truncate">
                  {currentUser.isOwn ? 'Вы' : currentUser.display_name}
                </p>
                {currentUser.verified && <VerifiedBadge size="sm" />}
              </div>
              <p className="text-white/60 text-xs">{timeAgo} назад</p>
            </div>
          </button>
          {isOwnStory && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
                setIsPaused(true);
              }}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className={cn("absolute left-0 right-0 z-20 px-4", isOtherUser ? "bottom-24" : "bottom-20")}>
            <p className="text-white text-center text-lg font-medium drop-shadow-lg">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Bottom reply bar for other users' stories */}
        {isOtherUser && (
          <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pb-4 pt-2">
            <div className="flex items-center gap-2">
              <input
                ref={replyInputRef}
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => { if (!replyText.trim()) setIsPaused(false); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && replyText.trim()) {
                    e.preventDefault();
                    sendStoryReply();
                  }
                }}
                placeholder="Отправить сообщение..."
                className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2.5 text-white text-sm placeholder:text-white/50 outline-none focus:border-white/40 transition-colors"
              />
              <button
                type="button"
                onClick={() => {
                  setLiked(!liked);
                  if (!liked) toast.success("❤️");
                }}
                className="p-2 transition-transform active:scale-125"
              >
                <Heart className={cn("w-6 h-6", liked ? "fill-destructive text-destructive" : "text-white")} />
              </button>
              {replyText.trim() ? (
                <button
                  type="button"
                  onClick={sendStoryReply}
                  disabled={sendingReply}
                  className="p-2 text-white active:scale-95 transition-transform disabled:opacity-50"
                >
                  <Send className="w-6 h-6" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShareOpen(true);
                    setIsPaused(true);
                  }}
                  className="p-2 text-white"
                >
                  <Send className="w-6 h-6 rotate-[-25deg]" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Delete confirmation for own stories */}
        {showDeleteConfirm && (
          <div 
            className="absolute inset-0 z-50 flex items-center justify-center"
            onClick={() => { setShowDeleteConfirm(false); setIsPaused(false); }}
          >
            <div className="absolute inset-0 bg-black/60" />
            <div 
              className="relative rounded-2xl overflow-hidden border border-white/20 p-6 max-w-[280px] w-[85vw]"
              style={{
                background: "rgba(30,40,55,0.95)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-white font-semibold text-lg mb-2">Удалить историю?</h3>
              <p className="text-white/60 text-sm mb-5">
                Это действие нельзя отменить.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setIsPaused(false); }}
                  className="flex-1 py-2.5 rounded-xl text-white/70 text-sm font-medium hover:bg-white/10 transition-colors border border-white/10"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDeleteStory}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/80 text-white text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  {deleting ? "Удаление..." : "Удалить"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Story Share Sheet */}
        <StoryShareSheet
          isOpen={shareOpen}
          onClose={() => { setShareOpen(false); setIsPaused(false); }}
          storyId={currentStory.id}
        />
      </div>
    </div>,
    document.body
  );
}
