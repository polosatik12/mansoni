import { X, Forward, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

interface SelectionHeaderProps {
  count: number;
  onCancel: () => void;
  onForward: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function SelectionHeader({ count, onCancel, onForward, onDelete, canDelete }: SelectionHeaderProps) {
  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ type: "spring", damping: 24, stiffness: 300 }}
      className="flex-shrink-0 safe-area-top relative z-10 backdrop-blur-xl bg-black/30 border-b border-white/10"
    >
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-white/10 active:bg-white/15 transition-colors"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>
          <span className="text-white font-semibold text-base">
            Выбрано: {count}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onForward}
            className="p-2.5 rounded-full hover:bg-white/10 active:bg-white/15 transition-colors"
            aria-label="Переслать"
          >
            <Forward className="w-5 h-5 text-[#6ab3f3]" />
          </button>
          {canDelete && (
            <button
              onClick={onDelete}
              className="p-2.5 rounded-full hover:bg-white/10 active:bg-white/15 transition-colors"
              aria-label="Удалить"
            >
              <Trash2 className="w-5 h-5 text-red-400" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
