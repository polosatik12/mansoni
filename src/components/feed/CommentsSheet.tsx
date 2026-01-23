import { useState, useRef, useEffect } from "react";
import { X, Heart, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useComments, Comment } from "@/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

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

export function CommentsSheet({ isOpen, onClose, postId, commentsCount }: CommentsSheetProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { comments, loading, addComment, toggleLike } = useComments(postId);
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
      authorName: comment.author.display_name,
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
    
    if (!result.error) {
      setNewComment("");
      setReplyingTo(null);
    }
  };

  const goToProfile = (userId: string) => {
    onClose();
    navigate(`/user/${userId}`);
  };

  // Focus input when replying
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  if (!isOpen) return null;

  const totalComments = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-[70] flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
          <h2 className="text-base font-semibold">Комментарии</h2>
          <span className="text-sm text-muted-foreground">
            {totalComments > 0 ? totalComments : commentsCount}
          </span>
        </div>
        
        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 native-scroll min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p className="text-sm">Пока нет комментариев</p>
              <p className="text-xs">Будьте первым!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                {/* Main comment */}
                <CommentItem
                  comment={comment}
                  onLike={() => handleLikeComment(comment)}
                  onReply={() => handleReply(comment)}
                  onGoToProfile={goToProfile}
                  formatTimeAgo={formatTimeAgo}
                />
                
                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-12 space-y-3 border-l-2 border-border pl-3">
                    {comment.replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        onLike={() => handleLikeComment(reply)}
                        onReply={() => handleReply(comment)} // Reply to parent, not to reply
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
        <div className="border-t border-border safe-area-bottom">
          {/* Reply indicator */}
          {replyingTo && (
            <div className="flex items-center justify-between px-4 py-2 bg-muted/50 text-sm">
              <span className="text-muted-foreground">
                Ответ для <span className="font-medium text-foreground">{replyingTo.authorName}</span>
              </span>
              <button 
                onClick={cancelReply}
                className="text-primary font-medium"
              >
                Отмена
              </button>
            </div>
          )}
          
          <div className="p-3 flex items-center gap-3">
            <img
              src={`https://i.pravatar.cc/150?u=${user?.id || 'guest'}`}
              alt="You"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                placeholder={user ? (replyingTo ? "Напишите ответ..." : "Добавьте комментарий...") : "Войдите чтобы комментировать"}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                className="pr-10 rounded-full bg-muted border-0"
                disabled={!user || submitting}
              />
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="text-primary"
              disabled={!newComment.trim() || submitting || !user}
              onClick={handleSubmitComment}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
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

function CommentItem({ comment, onLike, onReply, onGoToProfile, formatTimeAgo, isReply }: CommentItemProps) {
  const avatarUrl = comment.author.avatar_url || 
    `https://i.pravatar.cc/150?u=${comment.author.user_id}`;

  return (
    <div className="flex gap-3">
      <img
        src={avatarUrl}
        alt={comment.author.display_name}
        className={cn(
          "rounded-full object-cover flex-shrink-0 cursor-pointer",
          isReply ? "w-7 h-7" : "w-9 h-9"
        )}
        onClick={() => onGoToProfile(comment.author.user_id)}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <span 
              className="font-semibold text-sm cursor-pointer hover:underline"
              onClick={() => onGoToProfile(comment.author.user_id)}
            >
              {comment.author.display_name}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              {formatTimeAgo(comment.created_at)}
            </span>
            <p className="text-sm text-foreground mt-0.5">{comment.content}</p>
            <div className="flex items-center gap-4 mt-1.5">
              <button 
                onClick={onReply}
                className="text-xs text-muted-foreground font-medium hover:text-foreground transition-colors"
              >
                Ответить
              </button>
            </div>
          </div>
          <button
            onClick={onLike}
            className="flex flex-col items-center gap-0.5 pt-1"
          >
            <Heart 
              className={cn(
                "w-4 h-4",
                comment.liked_by_user 
                  ? "fill-destructive text-destructive" 
                  : "text-muted-foreground"
              )} 
            />
            <span className="text-xs text-muted-foreground">
              {comment.likes_count}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
