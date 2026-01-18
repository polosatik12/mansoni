import { useState } from "react";
import { X, Image, MapPin, Users, Smile, MoreHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CreatePostSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePostSheet({ isOpen, onClose }: CreatePostSheetProps) {
  const [text, setText] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleAddPhoto = () => {
    // Mock adding a photo
    const mockImages = [
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=80",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80",
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80",
    ];
    const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];
    setSelectedImages([...selectedImages, randomImage]);
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handlePublish = () => {
    // Here you would typically send the post to the backend
    console.log("Publishing post:", { text, images: selectedImages });
    setText("");
    setSelectedImages([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border safe-area-top">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-6 h-6" />
        </Button>
        <h1 className="font-semibold text-lg">Новая публикация</h1>
        <Button 
          size="sm" 
          className="rounded-full px-5 font-semibold"
          disabled={!text.trim() && selectedImages.length === 0}
          onClick={handlePublish}
        >
          Опубликовать
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto native-scroll">
        {/* Author */}
        <div className="flex items-center gap-3 px-4 py-3">
          <img
            src="https://i.pravatar.cc/150?img=32"
            alt="Your avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-sm">alex_ivanov</p>
            <button className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Все</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Text Input */}
        <div className="px-4">
          <Textarea
            placeholder="О чём вы думаете?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[120px] border-0 resize-none text-base p-0 focus-visible:ring-0 placeholder:text-muted-foreground"
          />
        </div>

        {/* Selected Images */}
        {selectedImages.length > 0 && (
          <div className="px-4 py-3">
            <div className="grid grid-cols-2 gap-2">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                  <img
                    src={image}
                    alt={`Selected ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add to post */}
        <div className="px-4 py-3 mt-auto">
          <div className="border border-border rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-sm">Добавить в публикацию</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleAddPhoto}
                className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center"
              >
                <Image className="w-5 h-5 text-green-500" />
              </button>
              <button className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </button>
              <button className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Smile className="w-5 h-5 text-yellow-500" />
              </button>
              <button className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-red-500" />
              </button>
              <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="px-4 pb-6 space-y-1">
          <button className="w-full flex items-center justify-between py-3 border-b border-border">
            <span className="text-sm">Добавить музыку</span>
            <ChevronDown className="w-5 h-5 text-muted-foreground -rotate-90" />
          </button>
          <button className="w-full flex items-center justify-between py-3 border-b border-border">
            <span className="text-sm">Настройки аудитории</span>
            <ChevronDown className="w-5 h-5 text-muted-foreground -rotate-90" />
          </button>
          <button className="w-full flex items-center justify-between py-3 border-b border-border">
            <span className="text-sm">Расширенные настройки</span>
            <ChevronDown className="w-5 h-5 text-muted-foreground -rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}
