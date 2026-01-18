import { useState } from "react";
import { X, Heart, Send, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Comment {
  id: string;
  author: {
    username: string;
    avatar: string;
    verified?: boolean;
  };
  text: string;
  timeAgo: string;
  likes: number;
  liked?: boolean;
  replies?: Comment[];
}

interface CommentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  commentsCount: number;
}

const mockComments: Comment[] = [
  {
    id: "1",
    author: {
      username: "designer_pro",
      avatar: "https://i.pravatar.cc/150?img=1",
      verified: true,
    },
    text: "Отличный дизайн! Очень вдохновляет 🔥",
    timeAgo: "2ч",
    likes: 24,
    liked: false,
  },
  {
    id: "2",
    author: {
      username: "dev_master",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    text: "Как ты это сделал? Можешь поделиться исходниками?",
    timeAgo: "1ч",
    likes: 12,
    liked: true,
  },
  {
    id: "3",
    author: {
      username: "anna_creative",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    text: "Сохранила себе в закладки! Супер работа 👏",
    timeAgo: "45м",
    likes: 8,
    liked: false,
  },
  {
    id: "4",
    author: {
      username: "tech_guru",
      avatar: "https://i.pravatar.cc/150?img=8",
      verified: true,
    },
    text: "Интересный подход к UI компонентам. Особенно понравились кнопки и формы",
    timeAgo: "30м",
    likes: 15,
    liked: false,
  },
  {
    id: "5",
    author: {
      username: "newbie_dev",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    text: "Учусь на твоих работах! Спасибо что делишься 🙏",
    timeAgo: "15м",
    likes: 5,
    liked: false,
  },
];

export function CommentsSheet({ isOpen, onClose, postId, commentsCount }: CommentsSheetProps) {
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState("");

  const handleLikeComment = (commentId: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          liked: !comment.liked,
          likes: comment.liked ? comment.likes - 1 : comment.likes + 1,
        };
      }
      return comment;
    }));
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      author: {
        username: "alex_ivanov",
        avatar: "https://i.pravatar.cc/150?img=32",
      },
      text: newComment,
      timeAgo: "сейчас",
      likes: 0,
      liked: false,
    };
    
    setComments([...comments, comment]);
    setNewComment("");
  };

  const goToProfile = (username: string) => {
    onClose();
    navigate(`/user/${username}`);
  };

  if (!isOpen) return null;

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
          <span className="text-sm text-muted-foreground">{commentsCount}</span>
        </div>
        
        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 native-scroll">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <img
                src={comment.author.avatar}
                alt={comment.author.username}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0 cursor-pointer"
                onClick={() => goToProfile(comment.author.username)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span 
                      className="font-semibold text-sm cursor-pointer hover:underline"
                      onClick={() => goToProfile(comment.author.username)}
                    >
                      {comment.author.username}
                    </span>
                    {comment.author.verified && (
                      <span className="ml-1 text-primary">✓</span>
                    )}
                    <span className="text-xs text-muted-foreground ml-2">{comment.timeAgo}</span>
                    <p className="text-sm text-foreground mt-0.5">{comment.text}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <button className="text-xs text-muted-foreground font-medium">
                        Ответить
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLikeComment(comment.id)}
                    className="flex flex-col items-center gap-0.5 pt-1"
                  >
                    <Heart 
                      className={cn(
                        "w-4 h-4",
                        comment.liked ? "fill-destructive text-destructive" : "text-muted-foreground"
                      )} 
                    />
                    <span className="text-xs text-muted-foreground">{comment.likes}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Input */}
        <div className="border-t border-border p-3 flex items-center gap-3 safe-area-bottom">
          <img
            src="https://i.pravatar.cc/150?img=32"
            alt="You"
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1 relative">
            <Input
              placeholder="Добавьте комментарий..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
              className="pr-10 rounded-full bg-muted border-0"
            />
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="text-primary"
            disabled={!newComment.trim()}
            onClick={handleSubmitComment}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
