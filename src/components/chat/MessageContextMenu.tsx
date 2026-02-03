import { useState, useEffect, useCallback } from "react";
import { X, Trash2, Pin, Copy, Forward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MessageContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  messageContent: string;
  isOwn: boolean;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  children: React.ReactNode;
}

const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🔥"];

export function MessageContextMenu({
  isOpen,
  onClose,
  messageId,
  messageContent,
  isOwn,
  onDelete,
  onPin,
  onReaction,
  children,
}: MessageContextMenuProps) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[300] flex items-center justify-center"
          onClick={onClose}
        >
          {/* Dark backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Content container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative z-10 flex flex-col items-center gap-3 px-4 max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick reactions bar */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="flex items-center gap-1.5 bg-[#1e2c3a] rounded-full px-2 py-1.5 shadow-xl"
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-110 transition-all text-2xl"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>

            {/* Focused message preview */}
            <div className="pointer-events-none">
              {children}
            </div>

            {/* Action buttons */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-[280px] bg-[#1e2c3a] rounded-xl overflow-hidden shadow-xl"
            >
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-white hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/10"
              >
                <Copy className="w-5 h-5 text-[#6ab3f3]" />
                <span className="text-[15px]">Копировать</span>
              </button>

              <button
                onClick={handlePin}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-white hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/10"
              >
                <Pin className="w-5 h-5 text-[#6ab3f3]" />
                <span className="text-[15px]">Закрепить</span>
              </button>

              {isOwn && onDelete && (
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-red-400 hover:bg-white/5 active:bg-white/10 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="text-[15px]">Удалить</span>
                </button>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for long press detection
export function useLongPress(
  onLongPress: () => void,
  delay = 500
) {
  const [isPressed, setIsPressed] = useState(false);
  const timerRef = { current: null as NodeJS.Timeout | null };

  const start = useCallback(() => {
    setIsPressed(true);
    timerRef.current = setTimeout(() => {
      onLongPress();
      setIsPressed(false);
    }, delay);
  }, [onLongPress, delay]);

  const stop = useCallback(() => {
    setIsPressed(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    isPressed,
  };
}
