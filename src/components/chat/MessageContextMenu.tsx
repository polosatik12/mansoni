import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Reply, Copy, Pin, Forward, Trash2, CheckSquare, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MessageContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  messageContent: string;
  isOwn: boolean;
  touchPoint?: { x: number; y: number };
  position?: { top: number; left: number; width: number; height: number; bottom: number; right: number };
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  onForward?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onSelect?: (messageId: string) => void;
}

const QUICK_REACTIONS = ["❤️", "🔥", "👍", "😂", "😮", "🎉"];

const MENU_WIDTH = 240;
const REACTIONS_HEIGHT = 48;
const MENU_ITEM_HEIGHT = 44;
const MENU_PADDING = 8;
const VIEWPORT_PAD = 12;

function triggerHaptic() {
  try {
    if (navigator.vibrate) navigator.vibrate(20);
  } catch {}
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
  onSelect,
}: MessageContextMenuProps) {
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Count menu items to estimate height
  const itemCount = 4 + (isOwn ? 2 : 0); // Reply, Copy, Pin, Forward + Edit, Delete for own
  const estimatedMenuHeight = REACTIONS_HEIGHT + 8 + (itemCount * MENU_ITEM_HEIGHT) + MENU_PADDING;

  // Haptic on open
  useEffect(() => {
    if (isOpen) triggerHaptic();
  }, [isOpen]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Elevate the source message above the backdrop
  useEffect(() => {
    if (!isOpen || !messageId) return;
    const el = document.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement | null;
    if (el) {
      el.style.position = "relative";
      el.style.zIndex = "50";
      el.style.transition = "transform 0.2s cubic-bezier(0.2,0,0,1)";
      el.style.transform = "scale(1.03)";
    }
    return () => {
      if (el) {
        el.style.position = "";
        el.style.zIndex = "";
        el.style.transition = "";
        el.style.transform = "";
      }
    };
  }, [isOpen, messageId]);

  // Compute menu position synchronously when isOpen changes
  useEffect(() => {
    if (!isOpen) {
      setMenuPos(null);
      return;
    }

    const vW = window.innerWidth;
    const vH = window.innerHeight;

    let anchorX: number;
    let anchorY: number;

    if (touchPoint) {
      anchorX = touchPoint.x;
      anchorY = touchPoint.y;
    } else if (position) {
      anchorX = isOwn ? position.right : position.left;
      anchorY = position.top + position.height / 2;
    } else {
      anchorX = vW / 2;
      anchorY = vH / 2;
    }

    // Horizontal: align to the side of the message
    let left: number;
    if (isOwn) {
      left = anchorX - MENU_WIDTH;
    } else {
      left = anchorX;
    }
    // Clamp to viewport
    left = Math.max(VIEWPORT_PAD, Math.min(left, vW - MENU_WIDTH - VIEWPORT_PAD));

    // Vertical: prefer below anchor, flip if no space
    const spaceBelow = vH - anchorY;
    const openUp = spaceBelow < estimatedMenuHeight + VIEWPORT_PAD;
    let top: number;
    if (openUp) {
      top = anchorY - estimatedMenuHeight - 8;
    } else {
      top = anchorY + 8;
    }
    // Clamp
    top = Math.max(VIEWPORT_PAD, Math.min(top, vH - estimatedMenuHeight - VIEWPORT_PAD));

    setMenuPos({ top, left, openUp });
  }, [isOpen, touchPoint, position, isOwn, estimatedMenuHeight]);

  const handleAction = useCallback((action: () => void) => {
    action();
    onClose();
  }, [onClose]);

  const menuContent = (
    <AnimatePresence>
      {isOpen && menuPos && (
        <motion.div
          key="context-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0"
          style={{ zIndex: 40, touchAction: "none" }}
          onClick={onClose}
        >
          {/* Blurred backdrop */}
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: "blur(8px) brightness(0.6)",
              WebkitBackdropFilter: "blur(8px) brightness(0.6)",
            }}
          />

          {/* Menu container */}
          <motion.div
            ref={menuRef}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 350, mass: 0.6 }}
            className="absolute flex flex-col gap-2"
            style={{
              top: menuPos.top,
              left: menuPos.left,
              width: MENU_WIDTH,
              transformOrigin: menuPos.openUp
                ? (isOwn ? "bottom right" : "bottom left")
                : (isOwn ? "top right" : "top left"),
              zIndex: 60,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick reactions bar */}
            <motion.div
              initial={{ y: menuPos.openUp ? 6 : -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.02, duration: 0.12 }}
              className={`flex items-center gap-0.5 rounded-full px-1.5 py-1 w-fit border border-white/20 ${isOwn ? "self-end" : "self-start"}`}
              style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(24px) saturate(1.5)",
                WebkitBackdropFilter: "blur(24px) saturate(1.5)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleAction(() => onReaction?.(messageId, emoji))}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-125 transition-all text-xl"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>

            {/* Action menu */}
            <motion.div
              initial={{ y: menuPos.openUp ? 6 : -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.04, duration: 0.12 }}
              className="rounded-2xl overflow-hidden border border-white/20"
              style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(24px) saturate(1.5)",
                WebkitBackdropFilter: "blur(24px) saturate(1.5)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              <MenuItem icon={Reply} label="Ответить" onClick={() => handleAction(() => onReply?.(messageId))} />
              <MenuItem icon={Copy} label="Скопировать" onClick={() => handleAction(async () => {
                try { await navigator.clipboard.writeText(messageContent); } catch {}
              })} />
              {isOwn && (
                <MenuItem icon={Pencil} label="Редактировать" onClick={() => handleAction(() => onEdit?.(messageId))} />
              )}
              <MenuItem icon={Pin} label="Закрепить" onClick={() => handleAction(() => onPin?.(messageId))} />
              <MenuItem icon={Forward} label="Переслать" onClick={() => handleAction(() => onForward?.(messageId))} />
              {isOwn && (
                <MenuItem icon={Trash2} label="Удалить" onClick={() => handleAction(() => onDelete?.(messageId))} isDestructive />
              )}
              <MenuItem icon={CheckSquare} label="Выбрать" onClick={() => handleAction(() => onSelect?.(messageId))} isLast />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

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
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 active:bg-white/15 rounded-lg transition-colors ${
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
