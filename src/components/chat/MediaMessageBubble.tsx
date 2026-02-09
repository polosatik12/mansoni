import { useState } from "react";
import { Check, CheckCheck, Eye } from "lucide-react";

/** Placeholders that should not be displayed as caption text */
const MEDIA_PLACEHOLDER_CONTENTS = new Set([
  "📷 Фото",
  "📎 Файл",
  "📷 Изображение",
  "🎥 Видео",
]);

/** Checks whether a URL looks like a PNG (potential sticker) */
const isPngUrl = (url: string): boolean => {
  try {
    const path = new URL(url).pathname;
    return path.toLowerCase().endsWith(".png");
  } catch {
    return url.toLowerCase().includes(".png");
  }
};

interface MediaMessageBubbleProps {
  mediaUrl: string;
  mediaType: "image" | "video";
  content?: string | null;
  time: string;
  isOwn: boolean;
  /** Read status — only rendered for own messages */
  isRead?: boolean;
  /** Edited flag */
  isEdited?: boolean;
  /** Channel-style view count (if provided, shown instead of check marks) */
  viewCount?: number;
  /** Bubble border-radius override (from grouping logic) */
  bubbleRadius?: string;
  /** Click handler for opening the image viewer */
  onImageClick?: () => void;
  /** Click handler for opening fullscreen video */
  onVideoClick?: () => void;
}

const formatViews = (count: number): string => {
  if (count >= 1_000_000)
    return (count / 1_000_000).toFixed(1).replace(".", ",") + "M";
  if (count >= 1_000)
    return (count / 1_000).toFixed(1).replace(".", ",") + "K";
  return count.toString();
};

export function MediaMessageBubble({
  mediaUrl,
  mediaType,
  content,
  time,
  isOwn,
  isRead,
  isEdited,
  viewCount,
  bubbleRadius = "rounded-2xl",
  onImageClick,
  onVideoClick,
}: MediaMessageBubbleProps) {
  const [imgLoaded, setImgLoaded] = useState(false);

  const hasCaption =
    !!content && !MEDIA_PLACEHOLDER_CONTENTS.has(content);
  const isSticker =
    mediaType === "image" && isPngUrl(mediaUrl) && !hasCaption;

  // --- Timestamp / status pill (reused in both overlay and footer) ---
  const timestampContent = (
    <>
      {viewCount !== undefined && (
        <>
          <Eye className="w-3.5 h-3.5" />
          <span className="text-[11px]">{formatViews(viewCount)}</span>
        </>
      )}
      {isEdited && <span className="text-[10px] italic">ред.</span>}
      <span className="text-[11px]">{time}</span>
      {isOwn && viewCount === undefined && (
        isRead ? (
          <CheckCheck className="w-3.5 h-3.5 text-[#6ab3f3]" />
        ) : (
          <Check className="w-3.5 h-3.5" />
        )
      )}
    </>
  );

  // --- Sticker mode: no bubble at all ---
  if (isSticker) {
    return (
      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        <img
          src={mediaUrl}
          alt=""
          className="max-w-[200px] h-auto object-contain cursor-pointer"
          onClick={onImageClick}
          onLoad={() => setImgLoaded(true)}
          draggable={false}
        />
        <div className="flex items-center gap-1 mt-0.5 text-white/40">
          {timestampContent}
        </div>
      </div>
    );
  }

  // --- Standard media bubble ---
  return (
    <div
      className={`${bubbleRadius} overflow-hidden max-w-[300px] cursor-pointer backdrop-blur-xl ${
        isOwn
          ? "bg-white/10 border border-white/10"
          : "bg-white/5 border border-white/10"
      }`}
      style={{
        boxShadow: isOwn
          ? "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.2)"
          : "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.15)",
      }}
      onClick={mediaType === "video" ? onVideoClick : onImageClick}
    >
      {/* Media */}
      <div className="relative">
        {mediaType === "video" ? (
          <video
            src={mediaUrl}
            className="w-full h-auto object-contain"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={mediaUrl}
            alt=""
            className="w-full h-auto object-contain"
            onLoad={() => setImgLoaded(true)}
            draggable={false}
          />
        )}

        {/* Overlay timestamp pill (image-only, no caption) */}
        {!hasCaption && (
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white/80">
            {timestampContent}
          </div>
        )}
      </div>

      {/* Caption + footer (only when caption exists) */}
      {hasCaption && (
        <div className="px-3 py-1.5">
          <p className="text-[15px] leading-[1.35] text-white whitespace-pre-wrap">
            {content}
          </p>
          <div className="flex items-center justify-end gap-1 mt-0.5 text-white/40">
            {timestampContent}
          </div>
        </div>
      )}
    </div>
  );
}
