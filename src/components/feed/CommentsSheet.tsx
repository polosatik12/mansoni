import { useState, useRef, useEffect } from "react";
import { Heart, Send, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useComments, Comment } from "@/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";

interface CommentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  commentsCount: number;
}

interface ReplyingTo {
  commentId: string;
  authorName: string;
}

export function CommentsSheet({
  isOpen,
  onClose,
  postId,
  commentsCount
}: CommentsSheetProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    comments,
    loading,
    addComment,
    toggleLike
  } = useComments(postId);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: false,
        locale: ru
      });
    } catch {
      return "";
    }
  };

  const handleLikeComment = async (comment: Comment) => {
    if (!user) return;
    await toggleLike(comment.id, comment.liked_by_user);
  };

  const handleReply = (comment: Comment) => {
    if (!user) return;
    setReplyingTo({
      commentId: comment.id,
      authorName: comment.author.display_name
    });
    setNewComment(`@${comment.author.display_name} `);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    const result = await addComment(newComment.trim(), replyingTo?.commentId);
    setSubmitting(false);
    if (result.error) {
      toast({
        title: "Ошибка",
        description: result.error,
        variant: "destructive",
      });
    } else {
      setNewComment("");
      setReplyingTo(null);
    }
  };

  const goToProfile = (userId: string) => {
    onClose();
    navigate(`/user/${userId}`);
  };

  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[92dvh] max-h-[92dvh] mt-0 flex flex-col bg-black/60 backdrop-blur-2xl border-t border-white/10 z-[200]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div className="w-8" />
          <h3 className="font-semibold text-white/90 text-base">
            Комментарии {totalComments > 0 && `(${totalComments})`}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8">
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 native-scroll min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-white/40" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-white/50 text-base">Пока нет комментариев</p>
              <p className="text-white/30 text-sm mt-1">Будьте первым!</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="space-y-3">
                <CommentItem 
                  comment={comment} 
                  onLike={() => handleLikeComment(comment)} 
                  onReply={() => handleReply(comment)} 
                  onGoToProfile={goToProfile} 
                  formatTimeAgo={formatTimeAgo} 
                />
                
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-12 space-y-3 border-l border-white/10 pl-3">
                    {comment.replies.map(reply => (
                      <CommentItem 
                        key={reply.id} 
                        comment={reply} 
                        onLike={() => handleLikeComment(reply)} 
                        onReply={() => handleReply(comment)}
                        onGoToProfile={goToProfile} 
                        formatTimeAgo={formatTimeAgo} 
                        isReply 
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Input */}
        <div className="border-t border-white/10 mt-auto">
          {replyingTo && (
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 text-sm">
              <span className="text-white/50">
                Ответ для <span className="font-medium text-white/80">@{replyingTo.authorName}</span>
              </span>
              <button onClick={cancelReply} className="text-[hsl(var(--primary))] font-medium text-sm">
                Отмена
              </button>
            </div>
          )}
          
          <div className="p-3 flex items-center gap-2 safe-area-bottom">
            <div className="flex-1">
              <input 
                ref={inputRef} 
                placeholder={user ? (replyingTo ? "Напишите ответ..." : "Добавьте комментарий...") : "Войдите чтобы комментировать"} 
                value={newComment} 
                onChange={e => setNewComment(e.target.value)} 
                onKeyDown={e => e.key === "Enter" && handleSubmitComment()} 
                className="w-full h-10 rounded-full bg-white/10 border border-white/10 px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 backdrop-blur-sm" 
                disabled={!user || submitting} 
              />
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              className="text-[hsl(var(--primary))] hover:bg-white/10 h-10 w-10" 
              disabled={!newComment.trim() || submitting || !user} 
              onClick={handleSubmitComment}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

interface CommentItemProps {
  comment: Comment;
  onLike: () => void;
  onReply: () => void;
  onGoToProfile: (userId: string) => void;
  formatTimeAgo: (date: string) => string;
  isReply?: boolean;
}

function CommentItem({
  comment,
  onLike,
  onReply,
  onGoToProfile,
  formatTimeAgo,
  isReply
}: CommentItemProps) {
  const avatarUrl = comment.author.avatar_url || `https://i.pravatar.cc/150?u=${comment.author.user_id}`;
  
  return (
    <div className="flex gap-3">
      <img 
        src={avatarUrl} 
        alt={comment.author.display_name} 
        className={cn(
          "rounded-full object-cover flex-shrink-0 cursor-pointer ring-1 ring-white/20", 
          isReply ? "w-7 h-7" : "w-9 h-9"
        )} 
        onClick={() => onGoToProfile(comment.author.user_id)} 
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span 
                className="font-semibold text-sm text-white/90 cursor-pointer hover:underline" 
                onClick={() => onGoToProfile(comment.author.user_id)}
              >
                {comment.author.display_name}
              </span>
              {comment.author.verified && <VerifiedBadge size="xs" />}
              <span className="text-xs text-white/40 ml-1">
                {formatTimeAgo(comment.created_at)}
              </span>
            </div>
            <p className="text-sm text-white/80 mt-1">{comment.content}</p>
            <div className="flex items-center gap-4 mt-2">
              <button 
                onClick={onReply} 
                className="text-xs text-white/40 font-medium hover:text-white/70 transition-colors"
              >
                Ответить
              </button>
            </div>
          </div>
          <button onClick={onLike} className="flex flex-col items-center gap-0.5 pt-1">
            <Heart 
              className={cn(
                "w-4 h-4", 
                comment.liked_by_user ? "fill-red-500 text-red-500" : "text-white/40"
              )} 
            />
            <span className="text-xs text-white/40">
              {comment.likes_count > 0 && comment.likes_count}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
