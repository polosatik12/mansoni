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

  // --- Compact timestamp / status pill content ---
  const timestampContent = (
    <>
      {viewCount !== undefined && (
        <>
          <Eye className="w-3 h-3" />
          <span className="text-[10px] leading-none">{formatViews(viewCount)}</span>
        </>
      )}
      {isEdited && <span className="text-[10px] leading-none italic">ред.</span>}
      <span className="text-[10px] leading-none">{time}</span>
      {isOwn && viewCount === undefined && (
        isRead ? (
          <CheckCheck className="w-3 h-3 text-[#6ab3f3]" />
        ) : (
          <Check className="w-3 h-3" />
        )
      )}
    </>
  );

  // --- Sticker mode: no bubble, no rounding, no shadow ---
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

  // --- Image/Video only (no caption) → no glass bubble, image sits directly on chat bg ---
  if (!hasCaption) {
    return (
      <div
        className="relative w-fit cursor-pointer"
        style={{ maxWidth: "85%" }}
        onClick={mediaType === "video" ? onVideoClick : onImageClick}
      >
        {mediaType === "video" ? (
          <video
            src={mediaUrl}
            className={`w-auto h-auto max-w-full object-contain ${bubbleRadius}`}
            style={{ maxHeight: 400 }}
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={mediaUrl}
            alt=""
            className={`w-auto h-auto max-w-full object-contain ${bubbleRadius}`}
            style={{ maxHeight: 400 }}
            onLoad={() => setImgLoaded(true)}
            draggable={false}
          />
        )}

        {/* Compact glass pill overlaid on the media — bottom right */}
        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-1.5 py-[3px] rounded-full bg-black/50 backdrop-blur-md text-white/90">
          {timestampContent}
        </div>
      </div>
    );
  }

  // --- Image/Video + Caption → glass bubble wraps both; image flush top/sides ---
  return (
    <div
      className={`${bubbleRadius} overflow-hidden cursor-pointer backdrop-blur-xl border border-white/10 ${
        isOwn ? "bg-white/10" : "bg-white/5"
      }`}
      style={{
        maxWidth: "85%",
        width: "fit-content",
        boxShadow: isOwn
          ? "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.2)"
          : "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.15)",
      }}
      onClick={mediaType === "video" ? onVideoClick : onImageClick}
    >
      {/* Media — flush with top and sides (zero padding) */}
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

      {/* Caption + timestamp below the image with standard padding */}
      <div className="px-3 py-1.5">
        <p className="text-[15px] leading-[1.35] text-white whitespace-pre-wrap">
          {content}
        </p>
        <div className="flex items-center justify-end gap-1 mt-0.5 text-white/40">
          {timestampContent}
        </div>
      </div>
    </div>
  );
}
