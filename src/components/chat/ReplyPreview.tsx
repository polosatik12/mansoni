import { X, Pencil } from "lucide-react";
import { motion } from "framer-motion";

interface ReplyPreviewProps {
  senderName: string;
  content: string;
  onClose: () => void;
  onScrollTo?: () => void;
}

export function ReplyPreview({ senderName, content, onClose, onScrollTo }: ReplyPreviewProps) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-2 backdrop-blur-xl bg-black/20 border-t border-white/10">
        {/* Accent bar */}
        <div className="w-0.5 h-8 rounded-full bg-[#6ab3f3] shrink-0" />

        {/* Reply content - clickable to scroll */}
        <button
          onClick={onScrollTo}
          className="flex-1 min-w-0 text-left"
        >
          <p className="text-[13px] font-medium text-[#6ab3f3] truncate">
            {senderName}
          </p>
          <p className="text-[13px] text-white/60 truncate">
            {content}
          </p>
        </button>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors shrink-0"
        >
          <X className="w-4 h-4 text-white/50" />
        </button>
      </div>
    </motion.div>
  );
}

interface EditPreviewProps {
  content: string;
  onClose: () => void;
}

export function EditPreview({ content, onClose }: EditPreviewProps) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-2 backdrop-blur-xl bg-black/20 border-t border-white/10">
        {/* Edit icon */}
        <Pencil className="w-4 h-4 text-[#6ab3f3] shrink-0" />

        {/* Edit info */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[#6ab3f3]">
            Редактирование
          </p>
          <p className="text-[13px] text-white/60 truncate">
            {content}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors shrink-0"
        >
          <X className="w-4 h-4 text-white/50" />
        </button>
      </div>
    </motion.div>
  );
}

interface QuotedReplyProps {
  senderName: string;
  content: string;
  onClick?: () => void;
}

export function QuotedReply({ senderName, content, onClick }: QuotedReplyProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-stretch gap-0 mb-1 w-full text-left rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-colors"
    >
      {/* Accent bar */}
      <div className="w-[3px] bg-[#6ab3f3] shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0 px-2 py-1">
        <p className="text-[12px] font-medium text-[#6ab3f3] truncate">
          {senderName}
        </p>
        <p className="text-[12px] text-white/50 truncate">
          {content}
        </p>
      </div>
    </button>
  );
}
