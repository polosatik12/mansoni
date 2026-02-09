import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";

interface MediaPreviewOverlayProps {
  file: File;
  mediaType: "image" | "video";
  onSend: (file: File, mediaType: "image" | "video", caption: string) => void;
  onCancel: () => void;
}

export function MediaPreviewOverlay({ file, mediaType, onSend, onCancel }: MediaPreviewOverlayProps) {
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    // Focus caption input after mount
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  const handleSend = async () => {
    if (sending) return;
    setSending(true);
    await onSend(file, mediaType, caption.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex flex-col bg-black/95">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 safe-area-top">
        <button
          onClick={onCancel}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <span className="text-white text-sm font-medium">
          {mediaType === "image" ? "Фото" : "Видео"}
        </span>
        <div className="w-10" />
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-4">
        {previewUrl && mediaType === "image" && (
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        )}
        {previewUrl && mediaType === "video" && (
          <video
            src={previewUrl}
            controls
            autoPlay
            muted
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        )}
      </div>

      {/* Caption input + Send */}
      <div className="px-3 py-3 safe-area-bottom">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Добавить подпись..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-11 px-5 rounded-full text-white placeholder:text-white/50 outline-none bg-white/10 backdrop-blur-xl border border-white/10 transition-all"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #00A3B4 0%, #0066CC 50%, #00C896 100%)',
              boxShadow: '0 0 25px rgba(0,163,180,0.5), 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
            }}
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
