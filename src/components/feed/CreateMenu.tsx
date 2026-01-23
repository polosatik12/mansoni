import { X, Image, Film, Radio, Sparkles, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
}

const menuItems = [
  { id: "post", label: "Публикация", icon: Image },
  { id: "story", label: "История", icon: Camera },
  { id: "reels", label: "Reels", icon: Film },
  { id: "live", label: "Прямой эфир", icon: Radio },
];

export function CreateMenu({ isOpen, onClose, onSelect }: CreateMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999]" onClick={onClose}>
      {/* Backdrop - covers everything including bottom nav */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Menu */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-200"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 bg-muted-foreground/20 rounded-full" />
        </div>

        {/* Title */}
        <div className="px-6 pb-4">
          <h2 className="text-xl font-semibold text-center">Создать</h2>
        </div>

        {/* Menu Items */}
        <div className="px-4 pb-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item.id);
                  onClose();
                }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:bg-muted transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <span className="text-[17px] font-normal">{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
