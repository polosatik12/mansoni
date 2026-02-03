import { X, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { ImageViewer } from "./ImageViewer";

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  created_at: string;
}

interface GroupedMedia {
  month: string;
  items: MediaItem[];
}

interface MediaGallerySheetProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  userId?: string;
  title: string;
  type: 'photos' | 'files' | 'links' | 'voice';
}

export function MediaGallerySheet({ isOpen, onClose, conversationId, userId, title, type }: MediaGallerySheetProps) {
  const [media, setMedia] = useState<GroupedMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !conversationId) return;

    const fetchMedia = async () => {
      setLoading(true);
      try {
        // Fetch media messages from the conversation
        const { data: messages } = await supabase
          .from('messages')
          .select('id, media_url, media_type, created_at')
          .eq('conversation_id', conversationId)
          .not('media_url', 'is', null)
          .in('media_type', type === 'photos' ? ['image'] : type === 'voice' ? ['voice'] : ['image', 'video'])
          .order('created_at', { ascending: false });

        if (messages && messages.length > 0) {
          // Group by month
          const grouped: Record<string, MediaItem[]> = {};
          
          messages.forEach(msg => {
            const date = new Date(msg.created_at);
            const monthKey = format(date, 'LLLL yyyy', { locale: ru });
            const capitalizedMonth = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
            
            if (!grouped[capitalizedMonth]) {
              grouped[capitalizedMonth] = [];
            }
            
            grouped[capitalizedMonth].push({
              id: msg.id,
              url: msg.media_url!,
              type: msg.media_type === 'image' ? 'image' : 'video',
              created_at: msg.created_at,
            });
          });

          setMedia(Object.entries(grouped).map(([month, items]) => ({ month, items })));
        } else {
          setMedia([]);
        }
      } catch (err) {
        console.error('Error fetching media:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [isOpen, conversationId, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-[#17212b]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button onClick={onClose} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <button onClick={onClose} className="p-2 -mr-2">
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto h-[calc(100vh-60px)]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : media.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/60">
            <p>Нет {type === 'photos' ? 'фотографий' : type === 'voice' ? 'голосовых сообщений' : 'файлов'}</p>
          </div>
        ) : (
          <div className="pb-8">
            {media.map((group) => (
              <div key={group.month}>
                {/* Month Header */}
                <div className="px-4 py-3 sticky top-0 bg-[#17212b] z-10">
                  <h2 className="text-sm font-medium text-white/60">{group.month}</h2>
                </div>
                
                {/* Grid */}
                <div className="grid grid-cols-3 gap-[2px] px-[2px]">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setViewingImage(item.url)}
                      className="aspect-square relative overflow-hidden bg-white/5"
                    >
                      <img
                        src={item.url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Viewer */}
      {viewingImage && (
        <ImageViewer
          src={viewingImage}
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  );
}
