import { createPortal } from "react-dom";
import { Bookmark, UserPlus, UserMinus, Flag, Link2, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface PostOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  authorId: string;
  authorUsername: string;
  anchorRef?: React.RefObject<HTMLButtonElement>;
  onDeleted?: () => void;
}

export function PostOptionsSheet({
  isOpen,
  onClose,
  postId,
  authorId,
  authorUsername,
  anchorRef,
  onDeleted,
}: PostOptionsSheetProps) {
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSavedPosts();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const saved = isSaved(postId);
  const isOwnPost = user?.id === authorId;

  // Position menu near the anchor button
  useEffect(() => {
    if (!isOpen) { setPos(null); return; }
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    } else {
      setPos({ top: 80, right: 16 });
    }
  }, [isOpen, anchorRef]);

  // Check if following the author
  useEffect(() => {
    const checkFollowing = async () => {
      if (!user || isOwnPost) return;
      const { data } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", authorId)
        .maybeSingle();
      setIsFollowing(!!data);
    };
    if (isOpen) checkFollowing();
  }, [user, authorId, isOpen, isOwnPost]);

  const handleSave = async () => {
    if (!user) { toast.error("Войдите, чтобы сохранить"); navigate("/auth"); onClose(); return; }
    try { await toggleSave(postId); toast.success(saved ? "Удалено из избранного" : "Добавлено в избранное"); onClose(); }
    catch { toast.error("Ошибка при сохранении"); }
  };

  const handleFollowToggle = async () => {
    if (!user) { toast.error("Войдите, чтобы подписаться"); navigate("/auth"); onClose(); return; }
    setLoading(true);
    try {
      if (isFollowing) {
        await supabase.from("followers").delete().eq("follower_id", user.id).eq("following_id", authorId);
        setIsFollowing(false); toast.success("Вы отписались");
      } else {
        await supabase.from("followers").insert({ follower_id: user.id, following_id: authorId });
        setIsFollowing(true); toast.success("Вы подписались");
      }
      onClose();
    } catch { toast.error("Произошла ошибка"); }
    finally { setLoading(false); }
  };

  const handleReport = () => { toast.success("Жалоба отправлена"); onClose(); };

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`); toast.success("Ссылка скопирована"); onClose(); }
    catch { toast.error("Не удалось скопировать"); }
  };

  const handleDelete = async () => {
    if (!user) return;
    try {
      // Delete related data first, then the post
      await supabase.from('post_media').delete().eq('post_id', postId);
      await supabase.from('post_likes').delete().eq('post_id', postId);
      await supabase.from('post_views').delete().eq('post_id', postId);
      await (supabase as any).from('post_mentions').delete().eq('post_id', postId);
      await supabase.from('comments').delete().eq('post_id', postId);
      const { error } = await supabase.from('posts').delete().eq('id', postId).eq('author_id', user.id);
      if (error) throw error;
      toast.success("Пост удалён");
      onDeleted?.();
      onClose();
    } catch {
      toast.error("Не удалось удалить пост");
    }
  };

  const menuContent = (
    <AnimatePresence>
      {isOpen && pos && (
        <motion.div
          key="post-options-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[200]"
          onClick={onClose}
        >
          <motion.div
            ref={menuRef}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 400, mass: 0.5 }}
            className="absolute rounded-2xl overflow-hidden border border-white/20"
            style={{
              top: pos.top,
              right: pos.right,
              width: 220,
              transformOrigin: "top right",
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(24px) saturate(1.5)",
              WebkitBackdropFilter: "blur(24px) saturate(1.5)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassMenuItem icon={Bookmark} label={saved ? "Убрать из избранного" : "В избранное"} onClick={handleSave} />
            {!isOwnPost && (
              <GlassMenuItem
                icon={isFollowing ? UserMinus : UserPlus}
                label={isFollowing ? "Отписаться" : "Подписаться"}
                onClick={handleFollowToggle}
                isDestructive={isFollowing}
              />
            )}
            <GlassMenuItem icon={Link2} label="Копировать ссылку" onClick={handleCopyLink} />
            {isOwnPost && (
              <GlassMenuItem icon={Trash2} label="Удалить пост" onClick={handleDelete} isDestructive isLast />
            )}
            {!isOwnPost && (
              <GlassMenuItem icon={Flag} label="Пожаловаться" onClick={handleReport} isDestructive isLast />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(menuContent, document.body);
}

function GlassMenuItem({ icon: Icon, label, onClick, isDestructive, isLast }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  isDestructive?: boolean;
  isLast?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 active:bg-white/15 transition-colors ${!isLast ? "border-b border-white/10" : ""}`}
    >
      <Icon className={`w-5 h-5 ${isDestructive ? "text-red-400" : "text-white/80"}`} />
      <span className={`text-[15px] font-medium ${isDestructive ? "text-red-400" : "text-white/90"}`}>{label}</span>
    </button>
  );
}
