import { useState, useRef, useCallback } from "react";
import { X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageViewerProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImageViewer({ src, alt = "Image", onClose }: ImageViewerProps) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const link = document.createElement("a");
    link.href = src;
    link.download = `image_${Date.now()}.jpg`;
    link.click();
  }, [src]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    setDragY(deltaY);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(dragY) > 120) {
      onClose();
    } else {
      setDragY(0);
    }
  };

  const opacity = Math.max(0.3, 1 - Math.abs(dragY) / 400);

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[80] flex items-center justify-center"
        style={{ backgroundColor: `rgba(0,0,0,${opacity})` }}
        onClick={handleBackdropClick}
      >
        {/* Top bar - minimal */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 z-10">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white active:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            onClick={handleDownload}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white active:bg-white/20 transition-colors"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>

        {/* Image - swipe down to close */}
        <motion.div
          className="flex items-center justify-center w-full h-full"
          style={{
            transform: `translateY(${dragY}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
