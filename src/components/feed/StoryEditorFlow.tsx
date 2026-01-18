import { useState } from "react";
import { X, ChevronDown, Camera, Type, Smile, Music, AtSign, ChevronRight, ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface StoryEditorFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock gallery images
const galleryImages = [
  { id: "1", src: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&q=80", isVideo: true, views: 175 },
  { id: "2", src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&q=80" },
  { id: "3", src: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&q=80" },
  { id: "4", src: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&q=80" },
  { id: "5", src: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=300&q=80" },
  { id: "6", src: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=300&q=80" },
];

const quickActions = [
  { id: "reply", label: "Ваш ответ", icon: "💬", color: "bg-green-500" },
  { id: "music", label: "Музыка", icon: "🎵", color: "bg-purple-500" },
  { id: "stickers", label: "Стикеры", icon: "😊", color: "bg-yellow-500" },
  { id: "collage", label: "Коллаж", icon: "🖼", color: "bg-blue-500" },
  { id: "audio", label: "Аудио", icon: "🎙", color: "bg-pink-500" },
];

type Step = "gallery" | "editor";

export function StoryEditorFlow({ isOpen, onClose }: StoryEditorFlowProps) {
  const [step, setStep] = useState<Step>("gallery");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  const handleSelectImage = (src: string) => {
    setSelectedImage(src);
    setStep("editor");
  };

  const handleBack = () => {
    if (step === "editor") {
      setStep("gallery");
      setSelectedImage(null);
    }
  };

  const handlePublish = (type: "story" | "close-friends") => {
    console.log("Publishing story:", { selectedImage, caption, type });
    setStep("gallery");
    setSelectedImage(null);
    setCaption("");
    onClose();
  };

  const handleClose = () => {
    setStep("gallery");
    setSelectedImage(null);
    setCaption("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      {/* Step 1: Gallery */}
      {step === "gallery" && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 safe-area-top">
            <Button variant="ghost" size="icon" className="text-white" onClick={handleClose}>
              <X className="w-6 h-6" />
            </Button>
            <h1 className="font-semibold text-lg text-white">Добавить в историю</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-white font-medium">
                Текст
              </Button>
              <span className="text-white text-2xl font-bold">Aa</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-4">
            <ScrollArea className="w-full">
              <div className="flex gap-3">
                {quickActions.map((action) => (
                  <button key={action.id} className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", action.color)}>
                      <span className="text-2xl">{action.icon}</span>
                    </div>
                    <span className="text-xs text-white">{action.label}</span>
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          </div>

          {/* Gallery Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <button className="flex items-center gap-1 text-white font-semibold">
              Недавние
              <ChevronDown className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-2 text-white">
              <span className="text-sm font-medium">Выбрать</span>
            </button>
          </div>

          {/* Gallery Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-4 gap-[2px]">
              {/* Camera button */}
              <button className="aspect-square bg-zinc-900 flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </button>
              
              {galleryImages.map((img) => (
                <button
                  key={img.id}
                  onClick={() => handleSelectImage(img.src)}
                  className="aspect-square relative"
                >
                  <img 
                    src={img.src} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                  {img.isVideo && (
                    <div className="absolute bottom-1 left-1 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-white" />
                      <span className="text-white text-xs">{img.views}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Step 2: Editor */}
      {step === "editor" && selectedImage && (
        <>
          {/* Full Screen Image */}
          <div className="flex-1 relative">
            <img 
              src={selectedImage} 
              alt="Story" 
              className="w-full h-full object-cover"
            />
            
            {/* Close Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 left-4 bg-black/40 text-white rounded-full safe-area-top"
              onClick={handleBack}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Right Side Tools */}
            <div className="absolute top-20 right-4 flex flex-col gap-4 safe-area-top">
              <button className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
                <span className="text-white font-bold text-lg">Aa</span>
              </button>
              <button className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
                <Smile className="w-6 h-6 text-white" />
              </button>
              <button className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </button>
              <button className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
                <AtSign className="w-6 h-6 text-white" />
              </button>
              <button className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
                <ChevronDown className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Bottom Gallery Preview */}
            <div className="absolute bottom-32 left-4 right-4 flex items-center gap-2">
              <button className="p-2 rounded-full bg-black/40" onClick={handleBack}>
                <ChevronRight className="w-5 h-5 text-white rotate-180" />
              </button>
              <div className="flex-1 flex justify-center">
                <div className="w-12 h-16 rounded-lg overflow-hidden border-2 border-white">
                  <img src={selectedImage} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
              <button className="p-2 rounded-full bg-black/40">
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Caption Input */}
            <div className="absolute bottom-20 left-4 right-4">
              <div className="flex items-center gap-3 bg-black/40 rounded-full px-4 py-3">
                <img 
                  src="https://i.pravatar.cc/32" 
                  alt="" 
                  className="w-8 h-8 rounded-full"
                />
                <input
                  type="text"
                  placeholder="Добавьте подпись..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder:text-white/60 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="bg-black px-4 py-4 flex items-center gap-3 safe-area-bottom">
            <button 
              onClick={() => handlePublish("story")}
              className="flex-1 flex items-center gap-3 bg-zinc-800 rounded-full px-4 py-3"
            >
              <img 
                src="https://i.pravatar.cc/40?img=32" 
                alt="" 
                className="w-8 h-8 rounded-full"
              />
              <span className="text-white font-medium">Ваши истории</span>
            </button>
            <button 
              onClick={() => handlePublish("close-friends")}
              className="flex items-center gap-2 bg-green-500 rounded-full px-4 py-3"
            >
              <span className="text-lg">⭐</span>
              <span className="text-white font-medium">Близкие др...</span>
            </button>
            <button 
              onClick={() => handlePublish("story")}
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center"
            >
              <ArrowRight className="w-6 h-6 text-primary-foreground" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
