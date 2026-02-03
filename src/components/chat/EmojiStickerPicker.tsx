import EmojiPicker, { EmojiStyle, EmojiClickData, Theme, Categories } from "emoji-picker-react";

interface EmojiStickerPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiStickerPicker({
  open,
  onOpenChange,
  onEmojiSelect,
}: EmojiStickerPickerProps) {
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
  };

  if (!open) return null;

  return (
    <div className="w-full bg-[#1c1c1e] border-t border-white/10 rounded-t-2xl overflow-hidden">
      {/* Drag handle */}
      <div className="flex justify-center py-2">
        <div className="w-10 h-1 rounded-full bg-white/30" />
      </div>
      
      {/* Custom styled emoji picker */}
      <div className="emoji-picker-ios">
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          emojiStyle={EmojiStyle.APPLE}
          theme={Theme.DARK}
          width="100%"
          height={320}
          searchDisabled={false}
          skinTonesDisabled={false}
          lazyLoadEmojis={true}
          previewConfig={{ showPreview: false }}
          searchPlaceHolder="Поиск эмодзи"
          categories={[
            { name: "Недавние", category: Categories.SUGGESTED },
            { name: "Смайлики", category: Categories.SMILEYS_PEOPLE },
            { name: "Животные", category: Categories.ANIMALS_NATURE },
            { name: "Еда", category: Categories.FOOD_DRINK },
            { name: "Путешествия", category: Categories.TRAVEL_PLACES },
            { name: "Активности", category: Categories.ACTIVITIES },
            { name: "Объекты", category: Categories.OBJECTS },
            { name: "Символы", category: Categories.SYMBOLS },
            { name: "Флаги", category: Categories.FLAGS },
          ]}
        />
      </div>
      
      {/* iOS-style bottom safe area */}
      <div className="h-safe-area-inset-bottom bg-[#1c1c1e]" />
      
      {/* Custom styles for iOS look */}
      <style>{`
        .emoji-picker-ios .EmojiPickerReact {
          --epr-bg-color: #1c1c1e !important;
          --epr-category-label-bg-color: #1c1c1e !important;
          --epr-hover-bg-color: rgba(255, 255, 255, 0.1) !important;
          --epr-focus-bg-color: rgba(255, 255, 255, 0.15) !important;
          --epr-search-input-bg-color: #2c2c2e !important;
          --epr-category-icon-active-color: #007aff !important;
          --epr-text-color: #ffffff !important;
          --epr-search-input-text-color: #ffffff !important;
          --epr-search-input-placeholder-color: rgba(255, 255, 255, 0.5) !important;
          --epr-picker-border-color: transparent !important;
          --epr-category-navigation-button-size: 28px !important;
          border: none !important;
          border-radius: 0 !important;
        }
        
        .emoji-picker-ios .EmojiPickerReact .epr-search-container {
          padding: 8px 12px !important;
        }
        
        .emoji-picker-ios .EmojiPickerReact .epr-search-container input {
          border-radius: 10px !important;
          padding: 10px 12px !important;
          font-size: 16px !important;
        }
        
        .emoji-picker-ios .EmojiPickerReact .epr-category-nav {
          padding: 8px 4px !important;
          gap: 2px !important;
        }
        
        .emoji-picker-ios .EmojiPickerReact .epr-category-nav button {
          border-radius: 8px !important;
        }
        
        .emoji-picker-ios .EmojiPickerReact .epr-emoji-category-label {
          font-size: 13px !important;
          font-weight: 600 !important;
          color: rgba(255, 255, 255, 0.6) !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          padding: 8px 12px 4px !important;
        }
        
        .emoji-picker-ios .EmojiPickerReact .epr-body {
          padding: 0 4px !important;
        }
        
        .emoji-picker-ios .EmojiPickerReact .epr-emoji-list {
          padding: 0 8px !important;
        }
        
        .emoji-picker-ios .EmojiPickerReact button.epr-emoji {
          border-radius: 8px !important;
        }
        
        .emoji-picker-ios .EmojiPickerReact .epr-emoji img {
          transition: transform 0.1s ease !important;
        }
        
        .emoji-picker-ios .EmojiPickerReact button.epr-emoji:active img {
          transform: scale(1.3) !important;
        }
        
        .emoji-picker-ios .EmojiPickerReact::-webkit-scrollbar {
          width: 4px !important;
        }
        
        .emoji-picker-ios .EmojiPickerReact::-webkit-scrollbar-track {
          background: transparent !important;
        }
        
        .emoji-picker-ios .EmojiPickerReact::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2) !important;
          border-radius: 4px !important;
        }
      `}</style>
    </div>
  );
}
