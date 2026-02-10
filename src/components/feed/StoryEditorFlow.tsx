import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronDown, Camera, Smile, Music, AtSign, ImagePlus, Wand2, Loader2, Pencil, Type, Undo2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimpleMediaEditor } from "@/components/editor";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useChatOpen } from "@/contexts/ChatOpenContext";

interface StoryEditorFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockGalleryImages = [
  { id: "1", src: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&q=80" },
  { id: "2", src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&q=80" },
  { id: "3", src: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&q=80" },
  { id: "4", src: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&q=80" },
  { id: "5", src: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=300&q=80" },
  { id: "6", src: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=300&q=80" },
  { id: "7", src: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=300&q=80" },
  { id: "8", src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&q=80" },
];

const DRAW_COLORS = ["#ffffff", "#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#007aff", "#af52de", "#000000"];

type Step = "camera" | "gallery" | "editor";
type EditorTool = null | "draw" | "text";

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
}

interface DrawPoint {
  x: number;
  y: number;
}

interface DrawLine {
  points: DrawPoint[];
  color: string;
  width: number;
}

export function StoryEditorFlow({ isOpen, onClose }: StoryEditorFlowProps) {
  const { user } = useAuth();
  const { setIsCreatingContent } = useChatOpen();
  const [step, setStep] = useState<Step>("camera");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editedBlob, setEditedBlob] = useState<Blob | null>(null);
  const [deviceImages, setDeviceImages] = useState<{ id: string; src: string; file: File }[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  // Editor tools
  const [activeTool, setActiveTool] = useState<EditorTool>(null);

  // Drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#ffffff");
  const [drawWidth] = useState(4);
  const [drawLines, setDrawLines] = useState<DrawLine[]>([]);
  const currentLineRef = useRef<DrawLine | null>(null);

  // Text overlay state
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [isAddingText, setIsAddingText] = useState(false);
  const [newText, setNewText] = useState("");
  const textInputRef = useRef<HTMLInputElement>(null);

  // Hide bottom nav
  useEffect(() => {
    setIsCreatingContent(isOpen);
    return () => setIsCreatingContent(false);
  }, [isOpen, setIsCreatingContent]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      // Fall back to gallery
      setStep("gallery");
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
      setCameraReady(false);
    }
  }, [cameraStream]);

  useEffect(() => {
    if (isOpen && step === "camera") {
      startCamera();
    }
    return () => {
      if (step !== "camera") return;
      // cleanup handled by stopCamera
    };
  }, [isOpen, step, startCamera]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        setSelectedImage(url);
        setSelectedFile(file);
        stopCamera();
        setStep("editor");
      }
    }, "image/jpeg", 0.92);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file, index) => ({
      id: `device-${Date.now()}-${index}`,
      src: URL.createObjectURL(file),
      file,
    }));
    setDeviceImages(prev => [...newImages, ...prev]);
  };

  const allImages = deviceImages.length > 0 ? deviceImages : mockGalleryImages;

  const handleSelectImage = async (src: string, file?: File) => {
    setSelectedImage(src);
    setEditedBlob(null);
    stopCamera();
    setStep("editor");
    if (file) {
      setSelectedFile(file);
      return;
    }
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const fileName = `gallery-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`;
      setSelectedFile(new File([blob], fileName, { type: blob.type }));
    } catch {
      setSelectedFile(null);
    }
  };

  // --- Drawing ---
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const allLines = [...drawLines];
    if (currentLineRef.current) allLines.push(currentLineRef.current);
    allLines.forEach(line => {
      if (!line || !line.points || line.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(line.points[0].x, line.points[0].y);
      for (let i = 1; i < line.points.length; i++) {
        ctx.lineTo(line.points[i].x, line.points[i].y);
      }
      ctx.stroke();
    });
  }, [drawLines]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getCanvasPoint = (e: React.TouchEvent | React.MouseEvent): DrawPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY : e.clientY;
    if (clientX === undefined || clientY === undefined) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handleDrawStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (activeTool !== "draw") return;
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) return;
    setIsDrawing(true);
    currentLineRef.current = { points: [point], color: drawColor, width: drawWidth };
  };

  const handleDrawMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || activeTool !== "draw") return;
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point || !currentLineRef.current) return;
    currentLineRef.current.points.push(point);
    redrawCanvas();
  };

  const handleDrawEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const finishedLine = currentLineRef.current;
    currentLineRef.current = null;
    if (finishedLine && finishedLine.points.length > 1) {
      setDrawLines(prev => [...prev, finishedLine]);
    }
  };

  const undoDraw = () => {
    setDrawLines(prev => prev.slice(0, -1));
  };

  // --- Text overlay ---
  const addTextOverlay = () => {
    if (!newText.trim()) {
      setIsAddingText(false);
      return;
    }
    setTextOverlays(prev => [
      ...prev,
      {
        id: `text-${Date.now()}`,
        text: newText.trim(),
        x: 50,
        y: 50,
        color: drawColor,
        fontSize: 24,
      },
    ]);
    setNewText("");
    setIsAddingText(false);
  };

  // --- Composite and publish ---
  const compositeImage = async (): Promise<Blob | null> => {
    if (!selectedImage) return null;

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }

        // Draw base image
        ctx.drawImage(img, 0, 0);

        // Draw lines
        drawLines.forEach(line => {
          if (!line || !line.points || line.points.length < 2) return;
          ctx.beginPath();
          ctx.strokeStyle = line.color;
          ctx.lineWidth = line.width * (img.width / (canvasRef.current?.width || img.width));
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.moveTo(
            (line.points[0].x / (canvasRef.current?.width || img.width)) * img.width,
            (line.points[0].y / (canvasRef.current?.height || img.height)) * img.height
          );
          for (let i = 1; i < line.points.length; i++) {
            ctx.lineTo(
              (line.points[i].x / (canvasRef.current?.width || img.width)) * img.width,
              (line.points[i].y / (canvasRef.current?.height || img.height)) * img.height
            );
          }
          ctx.stroke();
        });

        // Draw text overlays
        textOverlays.forEach(t => {
          const scale = img.width / (canvasRef.current?.width || img.width);
          ctx.font = `bold ${t.fontSize * scale}px sans-serif`;
          ctx.fillStyle = t.color;
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 4 * scale;
          ctx.fillText(t.text, (t.x / 100) * img.width, (t.y / 100) * img.height);
          ctx.shadowBlur = 0;
        });

        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
      };
      img.onerror = () => resolve(null);
      img.src = selectedImage;
    });
  };

  const handlePublish = async () => {
    if (!user) {
      toast.error("Войдите, чтобы опубликовать историю");
      return;
    }
    setIsPublishing(true);
    try {
      let mediaToUpload: Blob | null = editedBlob;

      // If we have drawings or text, composite them
      if (!mediaToUpload && (drawLines.length > 0 || textOverlays.length > 0)) {
        mediaToUpload = await compositeImage();
      }

      if (!mediaToUpload && selectedFile) {
        mediaToUpload = selectedFile;
      }
      if (!mediaToUpload && selectedImage) {
        const response = await fetch(selectedImage);
        mediaToUpload = await response.blob();
      }
      if (!mediaToUpload) throw new Error("Нет медиа для загрузки");

      const isVideo = mediaToUpload.type.startsWith("video/");
      const extension = isVideo ? "mp4" : "jpg";
      const fileName = `${user.id}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("stories-media")
        .upload(fileName, mediaToUpload, { contentType: mediaToUpload.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("stories-media")
        .getPublicUrl(fileName);

      const { error: insertError } = await (supabase
        .from("stories" as any)
        .insert({
          author_id: user.id,
          media_url: urlData.publicUrl,
          media_type: isVideo ? "video" : "image",
          caption: caption.trim() || null,
        }) as any);

      if (insertError) throw insertError;

      toast.success("История опубликована!");
      handleClose();
    } catch (error: any) {
      console.error("Error publishing story:", error);
      toast.error("Ошибка публикации", { description: error.message });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleEditorSave = (blob: Blob) => {
    setEditedBlob(blob);
    setSelectedImage(URL.createObjectURL(blob));
    setShowAdvancedEditor(false);
  };

  const handleClose = () => {
    setStep("camera");
    setSelectedImage(null);
    setSelectedFile(null);
    setEditedBlob(null);
    setCaption("");
    setDrawLines([]);
    setTextOverlays([]);
    setActiveTool(null);
    setIsAddingText(false);
    stopCamera();
    deviceImages.forEach(img => URL.revokeObjectURL(img.src));
    setDeviceImages([]);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* === CAMERA STEP === */}
      {step === "camera" && (
        <>
          {/* Camera Preview */}
          <div className="flex-1 relative bg-black overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
            />

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 pt-safe z-10">
              <button onClick={handleClose} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <X className="w-6 h-6 text-white" />
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    stopCamera();
                    setFacingMode(f => f === "user" ? "environment" : "user");
                  }}
                  className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 pb-safe">
              {/* Mode tabs */}
              <div className="flex justify-center gap-6 pb-4">
                <button
                  onClick={() => { stopCamera(); setStep("gallery"); }}
                  className="text-white/60 text-sm font-medium"
                >
                  Галерея
                </button>
                <span className="text-white text-sm font-semibold border-b-2 border-white pb-0.5">
                  Камера
                </span>
              </div>

              {/* Capture button */}
              <div className="flex items-center justify-center pb-6">
                <button
                  onClick={() => { stopCamera(); setStep("gallery"); }}
                  className="absolute left-6 w-10 h-10 rounded-lg overflow-hidden border-2 border-white/40"
                >
                  {allImages[0] && (
                    <img src={'src' in allImages[0] ? allImages[0].src : ''} alt="" className="w-full h-full object-cover" />
                  )}
                </button>

                <button
                  onClick={capturePhoto}
                  disabled={!cameraReady}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50"
                >
                  <div className="w-16 h-16 rounded-full bg-white" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === GALLERY STEP === */}
      {step === "gallery" && (
        <>
          <div className="flex items-center justify-between px-4 py-4 pt-safe">
            <button onClick={handleClose} className="text-white/60 hover:text-white">
              <X className="w-7 h-7" strokeWidth={1.5} />
            </button>
            <h1 className="font-medium text-[17px] text-white">Добавить в историю</h1>
            <button
              onClick={() => { stopCamera(); setStep("camera"); }}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex items-center justify-between px-4 py-3">
            <button className="flex items-center gap-1 text-white font-medium text-[15px]">
              Недавние <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-primary text-[15px] font-medium"
            >
              Выбрать
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-4 gap-[1px]">
              <button
                className="aspect-square bg-white/5 flex flex-col items-center justify-center gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="w-6 h-6 text-white/40" strokeWidth={1.5} />
                <span className="text-[10px] text-white/40">Галерея</span>
              </button>
              {allImages.map((img) => (
                <button
                  key={img.id}
                  onClick={() => handleSelectImage(img.src, 'file' in img ? (img as any).file : undefined)}
                  className="aspect-square relative"
                >
                  <img src={img.src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* === EDITOR STEP === */}
      {step === "editor" && selectedImage && (
        <>
          <div className="flex-1 relative overflow-hidden">
            {/* Base image */}
            <img
              src={selectedImage}
              alt="Story"
              className="w-full h-full object-cover"
            />

            {/* Drawing canvas overlay */}
            <canvas
              ref={canvasRef}
              width={1080}
              height={1920}
              className="absolute inset-0 w-full h-full"
              style={{ touchAction: activeTool === "draw" ? "none" : "auto", pointerEvents: activeTool === "draw" ? "auto" : "none" }}
              onTouchStart={handleDrawStart}
              onTouchMove={handleDrawMove}
              onTouchEnd={handleDrawEnd}
              onMouseDown={handleDrawStart}
              onMouseMove={handleDrawMove}
              onMouseUp={handleDrawEnd}
              onMouseLeave={handleDrawEnd}
            />

            {/* Text overlays - draggable */}
            {textOverlays.map((t) => (
              <div
                key={t.id}
                className="absolute select-none cursor-move z-15"
                style={{
                  left: `${t.x}%`,
                  top: `${t.y}%`,
                  transform: "translate(-50%, -50%)",
                  color: t.color,
                  fontSize: `${t.fontSize}px`,
                  fontWeight: "bold",
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                  whiteSpace: "nowrap",
                  touchAction: "none",
                  pointerEvents: activeTool === "draw" ? "none" : "auto",
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  const touch = e.touches[0];
                  const startX = touch.clientX;
                  const startY = touch.clientY;
                  const startPctX = t.x;
                  const startPctY = t.y;
                  const container = e.currentTarget.parentElement;
                  if (!container) return;
                  const rect = container.getBoundingClientRect();

                  const onMove = (ev: TouchEvent) => {
                    ev.preventDefault();
                    const dx = ev.touches[0].clientX - startX;
                    const dy = ev.touches[0].clientY - startY;
                    const newX = Math.max(5, Math.min(95, startPctX + (dx / rect.width) * 100));
                    const newY = Math.max(5, Math.min(95, startPctY + (dy / rect.height) * 100));
                    setTextOverlays(prev => prev.map(o => o.id === t.id ? { ...o, x: newX, y: newY } : o));
                  };
                  const onEnd = () => {
                    document.removeEventListener("touchmove", onMove);
                    document.removeEventListener("touchend", onEnd);
                  };
                  document.addEventListener("touchmove", onMove, { passive: false });
                  document.addEventListener("touchend", onEnd);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startPctX = t.x;
                  const startPctY = t.y;
                  const container = e.currentTarget.parentElement;
                  if (!container) return;
                  const rect = container.getBoundingClientRect();

                  const onMove = (ev: MouseEvent) => {
                    const dx = ev.clientX - startX;
                    const dy = ev.clientY - startY;
                    const newX = Math.max(5, Math.min(95, startPctX + (dx / rect.width) * 100));
                    const newY = Math.max(5, Math.min(95, startPctY + (dy / rect.height) * 100));
                    setTextOverlays(prev => prev.map(o => o.id === t.id ? { ...o, x: newX, y: newY } : o));
                  };
                  const onEnd = () => {
                    document.removeEventListener("mousemove", onMove);
                    document.removeEventListener("mouseup", onEnd);
                  };
                  document.addEventListener("mousemove", onMove);
                  document.addEventListener("mouseup", onEnd);
                }}
              >
                {t.text}
              </div>
            ))}

            {/* Text input overlay */}
            {isAddingText && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20" onClick={() => addTextOverlay()}>
                <input
                  ref={textInputRef}
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addTextOverlay(); }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  placeholder="Введите текст..."
                  className="bg-transparent text-white text-2xl font-bold text-center outline-none border-b-2 border-white/50 pb-2 w-4/5 placeholder:text-white/30"
                  style={{ color: drawColor }}
                />
              </div>
            )}

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 pt-safe z-10">
              <button
                onClick={() => {
                  setStep("gallery");
                  setSelectedImage(null);
                  setDrawLines([]);
                  setTextOverlays([]);
                  setActiveTool(null);
                }}
                className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Undo (while drawing) */}
              {activeTool === "draw" && drawLines.length > 0 && (
                <button
                  onClick={undoDraw}
                  className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
                >
                  <Undo2 className="w-5 h-5 text-white" />
                </button>
              )}
            </div>

            {/* Right side tools */}
            <div className="absolute top-16 right-4 flex flex-col gap-3 pt-safe z-10">
              {selectedFile && (
                <button
                  onClick={() => { setActiveTool(null); setShowAdvancedEditor(true); }}
                  className="w-11 h-11 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center"
                >
                  <Wand2 className="w-5 h-5 text-primary-foreground" strokeWidth={1.5} />
                </button>
              )}
              <button
                onClick={() => setActiveTool(activeTool === "draw" ? null : "draw")}
                className={`w-11 h-11 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
                  activeTool === "draw" ? "bg-white text-black" : "bg-black/30 text-white"
                }`}
              >
                <Pencil className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => {
                  setActiveTool("text");
                  setIsAddingText(true);
                  setTimeout(() => textInputRef.current?.focus(), 100);
                }}
                className={`w-11 h-11 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
                  activeTool === "text" ? "bg-white text-black" : "bg-black/30 text-white"
                }`}
              >
                <Type className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <Smile className="w-5 h-5 text-white" strokeWidth={1.5} />
              </button>
              <button className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <Music className="w-5 h-5 text-white" strokeWidth={1.5} />
              </button>
            </div>

            {/* Color picker (when drawing or adding text) */}
            {(activeTool === "draw" || isAddingText) && (
              <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-2 z-30 px-4">
                {DRAW_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setDrawColor(color);
                    }}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      drawColor === color ? "border-white scale-125" : "border-white/30"
                    }`}
                    style={{ backgroundColor: color, touchAction: "none" }}
                  />
                ))}
              </div>
            )}

            {/* Edited badge */}
            {editedBlob && (
              <div className="absolute top-4 right-16 px-3 py-1 bg-primary/90 rounded-full text-xs text-primary-foreground font-medium pt-safe z-10">
                Изменено ✨
              </div>
            )}
          </div>

          {/* Bottom publish actions */}
          {!isAddingText && (
            <div className="absolute bottom-0 left-0 right-0 px-4 py-6 bg-gradient-to-t from-black/60 to-transparent pb-safe z-10">
              {/* Caption input */}
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Добавить подпись..."
                className="w-full bg-white/10 backdrop-blur-sm text-white placeholder:text-white/40 rounded-full px-4 py-2.5 text-sm mb-3 outline-none border border-white/10"
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="flex-1 h-12 rounded-full bg-green-500/90 border-green-500 text-white hover:bg-green-600 hover:text-white"
                >
                  <span className="text-lg mr-2">⭐</span>
                  Близкие друзья
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold"
                >
                  {isPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Опубликовать"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Advanced Media Editor */}
      <SimpleMediaEditor
        open={showAdvancedEditor}
        onOpenChange={setShowAdvancedEditor}
        mediaFile={selectedFile}
        contentType="story"
        onSave={handleEditorSave}
        onCancel={() => setShowAdvancedEditor(false)}
      />
    </div>,
    document.body
  );
}
