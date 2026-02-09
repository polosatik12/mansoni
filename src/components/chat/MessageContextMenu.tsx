import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Reply, Copy, Pin, Forward, Trash2, CheckSquare, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MessageContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  messageContent: string;
  isOwn: boolean;
  /** Touch/click coordinates for precise menu placement */
  touchPoint?: { x: number; y: number };
  /** Bounding rect of the message bubble */
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
      navigator.vibrate(20);
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
  touchPoint,
  position,
  onDelete,
  onPin,
  onReaction,
  onReply,
  onForward,
  onEdit,
}: MessageContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const [ready, setReady] = useState(false);

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

  // Haptic feedback on open
  useEffect(() => {
    if (isOpen) {
      triggerHaptic();
      setReady(false);
    }
  }, [isOpen]);

  // Prevent scroll
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

  // Highlight the source message: elevate it above the backdrop overlay
  useEffect(() => {
    if (!isOpen || !messageId) return;

    const el = document.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement | null;
    if (el) {
      // Apply focus effect: elevate, slight scale, smooth transition
      el.style.position = "relative";
      el.style.zIndex = "302";
      el.style.transition = "transform 0.2s ease, filter 0.2s ease";
      el.style.transform = "scale(1.02)";
      el.style.filter = "brightness(1.1)";
    }

    return () => {
      if (el) {
        el.style.position = "";
        el.style.zIndex = "";
        el.style.transition = "";
        el.style.transform = "";
        el.style.filter = "";
      }
    };
  }, [isOpen, messageId]);

  // Compute precise menu position after first render
  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current) return;

    // Wait a frame for the menu to render with content
    requestAnimationFrame(() => {
      if (!menuRef.current) return;

      const menuRect = menuRef.current.getBoundingClientRect();
      const mW = menuRect.width || 260;
      const mH = menuRect.height || 320;
      const vW = window.innerWidth;
      const vH = window.innerHeight;
      const pad = 10;

      let x: number;
      let y: number;

      if (touchPoint) {
        // Use exact touch/click coords as anchor
        x = touchPoint.x;
        y = touchPoint.y;
      } else if (position) {
        // Fallback: center of bubble
        x = isOwn ? position.right : position.left;
        y = position.top + position.height / 2;
      } else {
        x = vW / 2;
        y = vH / 2;
      }

      // --- Horizontal positioning ---
      let left: number;
      if (isOwn) {
        // Align menu right edge near touch point
        left = x - mW;
      } else {
        left = x;
      }
      // Flip if overflowing
      if (left + mW > vW - pad) {
        left = vW - mW - pad;
      }
      if (left < pad) {
        left = pad;
      }

      // --- Vertical positioning ---
      let top: number;
      // Prefer placing menu below the touch point
      if (y + mH + pad <= vH) {
        top = y + 4;
      } else if (y - mH - pad >= 0) {
        // Flip upward
        top = y - mH - 4;
      } else {
        // Center if neither works
        top = Math.max(pad, (vH - mH) / 2);
      }
      top = Math.max(pad, Math.min(top, vH - mH - pad));

      setMenuStyle({ top, left, opacity: 1 });
      setReady(true);
    });
  }, [isOpen, touchPoint, position, isOwn]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setMenuStyle({ opacity: 0 });
      setReady(false);
    }
  }, [isOpen]);

  const menuContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[300]"
          onClick={onClose}
          style={{ touchAction: "none" }}
        >
          {/* Blurred dimming backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={{
              backdropFilter: "blur(4px) brightness(0.7)",
              WebkitBackdropFilter: "blur(4px) brightness(0.7)",
            }}
          />

          {/* Menu — precisely positioned */}
          <motion.div
            ref={menuRef}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: ready ? 1 : 0.9, opacity: ready ? 1 : 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 380, mass: 0.7 }}
            className="absolute flex flex-col gap-2"
            style={{
              ...menuStyle,
              width: "min(82vw, 260px)",
              transformOrigin: isOwn ? "top right" : "top left",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick reactions bar */}
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.03, duration: 0.15 }}
              className={`flex items-center gap-0.5 rounded-full px-1.5 py-1 shadow-2xl w-fit border border-white/20 ${isOwn ? "self-end" : "self-start"}`}
              style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(24px) saturate(1.5)",
                WebkitBackdropFilter: "blur(24px) saturate(1.5)",
              }}
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

            {/* Action menu — liquid glass */}
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.15 }}
              className="rounded-2xl overflow-hidden shadow-2xl border border-white/20"
              style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(24px) saturate(1.5)",
                WebkitBackdropFilter: "blur(24px) saturate(1.5)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
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

  // Render via Portal to avoid parent clipping
  return createPortal(menuContent, document.body);
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
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 active:bg-white/15 transition-colors ${
        !isLast ? "border-b border-white/10" : ""
      }`}
    >
      <Icon className={`w-5 h-5 ${isDestructive ? "text-red-400" : "text-white/80"}`} />
      <span className={`text-[15px] font-medium ${isDestructive ? "text-red-400" : "text-white/90"}`}>
        {label}
      </span>
    </button>
  );
}
