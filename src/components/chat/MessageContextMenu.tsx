import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { Reply, Copy, Pin, Forward, Trash2, CheckSquare, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MessageContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  messageContent: string;
  isOwn: boolean;
  /** Bounding rect of the message bubble that was long-pressed */
  position?: { top: number; left: number; width: number; height: number; bottom: number; right: number };
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  onForward?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
}

const QUICK_REACTIONS = ["❤️", "🔥", "👍", "😂", "😮", "🎉"];

/** Trigger haptic feedback on supported devices */
function triggerHaptic() {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch {
    // silently ignore
  }
}

export function MessageContextMenu({
  isOpen,
  onClose,
  messageId,
  messageContent,
  isOwn,
  position,
  onDelete,
  onPin,
  onReaction,
  onReply,
  onForward,
  onEdit,
}: MessageContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<React.CSSProperties>({});

  const handleReaction = (emoji: string) => {
    onReaction?.(messageId, emoji);
    onClose();
  };

  const handleDelete = () => {
    onDelete?.(messageId);
    onClose();
  };

  const handlePin = () => {
    onPin?.(messageId);
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
    onClose();
  };

  const handleReply = () => {
    onReply?.(messageId);
    onClose();
  };

  const handleForward = () => {
    onForward?.(messageId);
    onClose();
  };

  const handleEdit = () => {
    onEdit?.(messageId);
    onClose();
  };

  // Haptic feedback when opening
  useEffect(() => {
    if (isOpen) {
      triggerHaptic();
    }
  }, [isOpen]);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Calculate position after menu renders so we know its height
  useLayoutEffect(() => {
    if (!isOpen || !position || !menuRef.current) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const menuWidth = menuRect.width || 280;
    const menuHeight = menuRect.height || 300;
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    const pad = 12;

    // --- Horizontal: align to the bubble side ---
    let left: number;
    if (isOwn) {
      // Right-align: menu right edge aligns with bubble right edge
      left = position.right - menuWidth;
    } else {
      // Left-align: menu left edge aligns with bubble left edge
      left = position.left;
    }
    // Clamp horizontal
    left = Math.max(pad, Math.min(left, viewW - menuWidth - pad));

    // --- Vertical: prefer below the bubble, otherwise above ---
    const spaceBelow = viewH - position.bottom;
    const spaceAbove = position.top;
    let top: number;

    if (spaceBelow >= menuHeight + pad) {
      // Position below the bubble
      top = position.bottom + 6;
    } else if (spaceAbove >= menuHeight + pad) {
      // Position above the bubble
      top = position.top - menuHeight - 6;
    } else {
      // Not enough space either way — center vertically and scroll
      top = Math.max(pad, (viewH - menuHeight) / 2);
    }
    // Clamp vertical
    top = Math.max(pad, Math.min(top, viewH - menuHeight - pad));

    setMenuPos({ top, left });
  }, [isOpen, position, isOwn]);

  // Highlight the source message element
  useEffect(() => {
    if (!isOpen || !messageId) return;

    const el = document.querySelector(`[data-message-id="${messageId}"]`);
    if (el) {
      (el as HTMLElement).style.position = "relative";
      (el as HTMLElement).style.zIndex = "301";
    }

    return () => {
      if (el) {
        (el as HTMLElement).style.position = "";
        (el as HTMLElement).style.zIndex = "";
      }
    };
  }, [isOpen, messageId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[300]"
          onClick={onClose}
        >
          {/* Dimming backdrop — the highlighted message sits above this via z-index */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

          {/* Menu container — positioned precisely */}
          <motion.div
            ref={menuRef}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 420, mass: 0.8 }}
            className="absolute flex flex-col gap-2"
            style={{
              ...menuPos,
              width: "min(85vw, 280px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick reactions bar */}
            <motion.div
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.02, duration: 0.15 }}
              className={`flex items-center gap-0.5 bg-[#1e2c3a] rounded-full px-1.5 py-1 shadow-xl w-fit ${isOwn ? "self-end" : "self-start"}`}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-125 transition-all text-xl"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>

            {/* Action menu */}
            <motion.div
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.04, duration: 0.15 }}
              className="bg-[#1e2c3a] rounded-xl overflow-hidden shadow-xl"
            >
              <MenuItem icon={Reply} label="Ответить" onClick={handleReply} />
              <MenuItem icon={Copy} label="Скопировать" onClick={handleCopy} />
              {isOwn && (
                <MenuItem icon={Pencil} label="Редактировать" onClick={handleEdit} />
              )}
              <MenuItem icon={Pin} label="Закрепить" onClick={handlePin} />
              <MenuItem icon={Forward} label="Переслать" onClick={handleForward} />
              {isOwn && (
                <MenuItem icon={Trash2} label="Удалить для всех" onClick={handleDelete} isDestructive />
              )}
              <MenuItem icon={CheckSquare} label="Выбрать" onClick={onClose} isLast />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface MenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  isDestructive?: boolean;
  isLast?: boolean;
}

function MenuItem({ icon: Icon, label, onClick, isDestructive, isLast }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors ${
        !isLast ? "border-b border-white/5" : ""
      }`}
    >
      <Icon className={`w-5 h-5 ${isDestructive ? "text-red-400" : "text-white/70"}`} />
      <span className={`text-[15px] ${isDestructive ? "text-red-400" : "text-white"}`}>
        {label}
      </span>
    </button>
  );
}
