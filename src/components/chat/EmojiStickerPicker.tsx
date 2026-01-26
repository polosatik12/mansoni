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
    <div className="w-full bg-[#17212b] border-t border-white/10">
      <EmojiPicker
        onEmojiClick={handleEmojiClick}
        emojiStyle={EmojiStyle.APPLE}
        theme={Theme.DARK}
        width="100%"
        height={280}
        searchDisabled={true}
        skinTonesDisabled={true}
        lazyLoadEmojis={true}
        previewConfig={{ showPreview: false }}
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
  );
}
