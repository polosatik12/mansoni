import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface AvatarViewerProps {
  src: string;
  name: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AvatarViewer({ src, name, isOpen, onClose }: AvatarViewerProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-[80] flex flex-col items-center justify-center"
          onClick={handleBackdropClick}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
            <span className="text-white font-semibold text-sm">{name}</span>
            <div className="w-10" />
          </div>

          {/* Avatar image */}
          <motion.img
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            src={src}
            alt={name}
            className="w-72 h-72 rounded-full object-cover"
            draggable={false}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
