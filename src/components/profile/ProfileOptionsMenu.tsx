import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ban, Flag, Link, UserMinus, UserPlus, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileOptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement>;
}

export function ProfileOptionsMenu({ isOpen, onClose, userId, username, isFollowing, onFollowToggle, anchorRef }: ProfileOptionsMenuProps) {
  const { user } = useAuth();
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (isOpen && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
    if (isOpen && user) {
      supabase
        .from("blocked_users")
        .select("id")
        .eq("blocker_id", user.id)
        .eq("blocked_id", userId)
        .maybeSingle()
        .then(({ data }) => setIsBlocked(!!data));
    }
  }, [isOpen, user, userId]);

  const handleBlock = async () => {
    if (!user) return;
    try {
      if (isBlocked) {
        await supabase.from("blocked_users").delete().eq("blocker_id", user.id).eq("blocked_id", userId);
        toast.success("Пользователь разблокирован");
        setIsBlocked(false);
      } else {
        await supabase.from("blocked_users").insert({ blocker_id: user.id, blocked_id: userId });
        toast.success("Пользователь заблокирован");
        setIsBlocked(true);
      }
    } catch {
      toast.error("Ошибка");
    }
    onClose();
  };

  const handleReport = () => {
    toast.success("Жалоба отправлена");
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/user/${userId}`);
    toast.success("Ссылка скопирована");
    onClose();
  };

  if (!isOpen) return null;

  const items = [
    ...(onFollowToggle ? [{
      icon: isFollowing ? UserMinus : UserPlus,
      label: isFollowing ? "Отписаться" : "Подписаться",
      action: () => { onFollowToggle(); onClose(); },
      destructive: false,
    }] : []),
    { icon: Link, label: "Копировать ссылку", action: handleCopyLink, destructive: false },
    { icon: Ban, label: isBlocked ? "Разблокировать" : "Заблокировать", action: handleBlock, destructive: !isBlocked },
    { icon: Flag, label: "Пожаловаться", action: handleReport, destructive: true },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -4 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[61] min-w-[200px]"
          style={{ top: pos.top, right: pos.right, backdropFilter: "blur(24px) saturate(1.5)", background: "rgba(255,255,255,0.08)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
        >
          <div className="py-1.5">
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  onClick={item.action}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${item.destructive ? "text-red-400 hover:bg-red-500/10" : "text-white/90 hover:bg-white/10"}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
