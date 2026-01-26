import { useState } from "react";
import EmojiPicker, { EmojiStyle, EmojiClickData, Theme, Categories } from "emoji-picker-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-0 bg-[#17212b] max-h-[60vh]">
        <div className="w-full flex justify-center">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            emojiStyle={EmojiStyle.APPLE}
            theme={Theme.DARK}
            width="100%"
            height={400}
            searchPlaceholder="Поиск эмодзи..."
            skinTonesDisabled={false}
            lazyLoadEmojis={true}
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
      </DrawerContent>
    </Drawer>
  );
}
