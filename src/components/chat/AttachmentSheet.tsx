import { useRef } from "react";
import { Camera, Image, Film, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AttachmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFile: (file: File, type: "image" | "video") => void;
}

export function AttachmentSheet({
  open,
  onOpenChange,
  onSelectFile,
}: AttachmentSheetProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = () => {
    photoInputRef.current?.click();
  };

  const handleVideoSelect = () => {
    videoInputRef.current?.click();
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectFile(file, type);
      onOpenChange(false);
    }
    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl" hideCloseButton>
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Прикрепить</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-4 pb-6">
          {/* Photo */}
          <button
            onClick={handlePhotoSelect}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Image className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-sm font-medium">Фото</span>
          </button>

          {/* Video */}
          <button
            onClick={handleVideoSelect}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Film className="w-6 h-6 text-purple-500" />
            </div>
            <span className="text-sm font-medium">Видео</span>
          </button>

          {/* Camera */}
          <button
            onClick={handleCameraCapture}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Camera className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-sm font-medium">Камера</span>
          </button>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e, "image")}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFileChange(e, "video")}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileChange(e, "image")}
        />
      </SheetContent>
    </Sheet>
  );
}
