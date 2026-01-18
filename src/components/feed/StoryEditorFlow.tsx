import { useState } from "react";
import { X, ChevronDown, Camera, Type, Smile, Music, AtSign, ChevronRight, ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  { id: "7", src: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=300&q=80" },
  { id: "8", src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&q=80" },
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
          <div className="flex items-center justify-between px-4 py-4 safe-area-top">
            <button onClick={handleClose} className="text-white/80 hover:text-white">
              <X className="w-7 h-7" strokeWidth={1.5} />
            </button>
            <h1 className="font-medium text-[17px] text-white">Добавить в историю</h1>
            <div className="flex items-center gap-3">
              <span className="text-white/80 text-[15px]">Текст</span>
              <span className="text-white text-xl font-semibold">Aa</span>
            </div>
          </div>

          {/* Gallery Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <button className="flex items-center gap-1 text-white font-medium text-[15px]">
              Недавние
              <ChevronDown className="w-4 h-4" />
            </button>
            <button className="text-white/80 text-[15px]">
              Выбрать
            </button>
          </div>

          {/* Gallery Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-4 gap-[1px]">
              {/* Camera button */}
              <button className="aspect-square bg-zinc-900/80 flex items-center justify-center">
                <Camera className="w-7 h-7 text-white/70" strokeWidth={1.5} />
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
                    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-white drop-shadow-lg" />
                      <span className="text-white text-xs font-medium drop-shadow-lg">{img.views}</span>
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
            <button 
              className="absolute top-4 left-4 w-10 h-10 bg-black/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center safe-area-top"
              onClick={handleBack}
            >
              <X className="w-6 h-6" strokeWidth={1.5} />
            </button>

            {/* Right Side Tools */}
            <div className="absolute top-16 right-4 flex flex-col gap-3 safe-area-top">
              <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white font-semibold text-[15px]">Aa</span>
              </button>
              <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <Smile className="w-5 h-5 text-white" strokeWidth={1.5} />
              </button>
              <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <Music className="w-5 h-5 text-white" strokeWidth={1.5} />
              </button>
              <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <AtSign className="w-5 h-5 text-white" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="absolute bottom-0 left-0 right-0 px-4 py-5 flex items-center justify-end gap-3 safe-area-bottom">
            <button 
              onClick={() => handlePublish("close-friends")}
              className="flex items-center gap-2 bg-green-500 rounded-full px-5 py-3"
            >
              <span className="text-lg">⭐</span>
              <span className="text-white font-medium text-[15px]">Близкие др...</span>
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
