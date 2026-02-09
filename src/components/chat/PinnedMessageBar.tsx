import { Pin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PinnedMessageBarProps {
  senderName: string;
  content: string;
  onScrollTo: () => void;
  onUnpin?: () => void;
}

export function PinnedMessageBar({
  senderName,
  content,
  onScrollTo,
  onUnpin,
}: PinnedMessageBarProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 backdrop-blur-xl bg-black/30 border-b border-white/10"
      >
        <button
          onClick={onScrollTo}
          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors text-left"
        >
          <Pin className="w-4 h-4 text-[#6ab3f3] shrink-0 rotate-45" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#6ab3f3]">
              {senderName}
            </p>
            <p className="text-xs text-white/60 truncate">{content}</p>
          </div>
          {onUnpin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnpin();
              }}
              className="p-1 rounded-full hover:bg-white/10 transition-colors shrink-0"
              aria-label="Открепить"
            >
              <X className="w-3.5 h-3.5 text-white/40" />
            </button>
          )}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
