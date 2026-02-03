import { X, ArrowLeft, Play, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { ImageViewer } from "./ImageViewer";

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video' | 'file' | 'voice' | 'link';
  created_at: string;
  filename?: string;
  filesize?: number;
  duration?: number;
  sender_name?: string;
  link_title?: string;
  link_description?: string;
  link_preview?: string;
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

// Helper to get file extension badge color
const getFileExtensionColor = (ext: string): string => {
  const colors: Record<string, string> = {
    xls: 'bg-green-600',
    xlsx: 'bg-green-600',
    doc: 'bg-blue-600',
    docx: 'bg-blue-600',
    pdf: 'bg-red-600',
    zip: 'bg-yellow-600',
    rar: 'bg-yellow-600',
    heic: 'bg-purple-600',
    jpg: 'bg-pink-600',
    jpeg: 'bg-pink-600',
    png: 'bg-pink-600',
  };
  return colors[ext.toLowerCase()] || 'bg-gray-600';
};

// Helper to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Helper to format duration
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function MediaGallerySheet({ isOpen, onClose, conversationId, userId, title, type }: MediaGallerySheetProps) {
  const [media, setMedia] = useState<GroupedMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !conversationId) return;

    const fetchMedia = async () => {
      setLoading(true);
      try {
        // For demo purposes, generate mock data based on type
        // In production, this would fetch from Supabase with proper filters
        const mockData: GroupedMedia[] = [];
        
        if (type === 'photos') {
          const { data: messages } = await supabase
            .from('messages')
            .select('id, media_url, media_type, created_at')
            .eq('conversation_id', conversationId)
            .not('media_url', 'is', null)
            .in('media_type', ['image'])
            .order('created_at', { ascending: false });

          if (messages && messages.length > 0) {
            const grouped: Record<string, MediaItem[]> = {};
            messages.forEach(msg => {
              const date = new Date(msg.created_at);
              const monthKey = format(date, 'LLLL yyyy', { locale: ru });
              const capitalizedMonth = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
              if (!grouped[capitalizedMonth]) grouped[capitalizedMonth] = [];
              grouped[capitalizedMonth].push({
                id: msg.id,
                url: msg.media_url!,
                type: 'image',
                created_at: msg.created_at,
              });
            });
            setMedia(Object.entries(grouped).map(([month, items]) => ({ month, items })));
          } else {
            setMedia([]);
          }
        } else if (type === 'files') {
          // Mock file data
          mockData.push({
            month: 'Январь',
            items: [
              { id: '1', url: '#', type: 'file', created_at: '2025-01-06T21:33:00', filename: 'СТОК 19.05.2025.xls', filesize: 3.8 * 1024 * 1024 },
            ]
          }, {
            month: 'Декабрь',
            items: [
              { id: '2', url: '#', type: 'file', created_at: '2024-12-20T20:56:00', filename: 'IMG_4670.HEIC', filesize: 2.2 * 1024 * 1024 },
              { id: '3', url: '#', type: 'file', created_at: '2024-12-20T20:56:00', filename: 'IMG_4671.HEIC', filesize: 2.4 * 1024 * 1024 },
            ]
          }, {
            month: 'Сентябрь 2025 г.',
            items: [
              { id: '4', url: '#', type: 'file', created_at: '2025-09-02T04:54:00', filename: '68S9BC_1H-VKO-AER.pdf', filesize: 154.8 * 1024 },
            ]
          });
          setMedia(mockData);
        } else if (type === 'voice') {
          // Mock voice data
          mockData.push({
            month: 'Февраль',
            items: [
              { id: '1', url: '#', type: 'voice', created_at: '2025-02-03T03:14:00', sender_name: 'Руха', duration: 10 },
              { id: '2', url: '#', type: 'voice', created_at: '2025-02-02T19:25:00', sender_name: 'Руха', duration: 10 },
              { id: '3', url: '#', type: 'voice', created_at: '2025-02-02T19:22:00', sender_name: 'Руха', duration: 24 },
              { id: '4', url: '#', type: 'voice', created_at: '2025-02-02T19:22:00', sender_name: 'Руха', duration: 14 },
            ]
          }, {
            month: 'Январь',
            items: [
              { id: '5', url: '#', type: 'voice', created_at: '2025-01-27T04:45:00', sender_name: 'Александр', duration: 2 },
              { id: '6', url: '#', type: 'voice', created_at: '2025-01-27T04:45:00', sender_name: 'Александр', duration: 26 },
              { id: '7', url: '#', type: 'voice', created_at: '2025-01-25T20:52:00', sender_name: 'Руха', duration: 59 },
              { id: '8', url: '#', type: 'voice', created_at: '2025-01-25T20:50:00', sender_name: 'Александр', duration: 11 },
              { id: '9', url: '#', type: 'voice', created_at: '2025-01-25T20:49:00', sender_name: 'Александр', duration: 5 },
              { id: '10', url: '#', type: 'voice', created_at: '2025-01-25T20:48:00', sender_name: 'Руха', duration: 11 },
            ]
          });
          setMedia(mockData);
        } else if (type === 'links') {
          // Mock links data
          mockData.push({
            month: '3 февраля',
            items: [
              { id: '1', url: '#', type: 'link', created_at: '2025-02-03T00:00:00', link_title: '5302000503431763', link_description: '02/31' },
            ]
          }, {
            month: '7 января',
            items: [
              { id: '2', url: '#', type: 'link', created_at: '2025-01-07T00:00:00', link_title: '⚡ Массовое отравление кониной произошло в Подмосковье — восемь человек, включая детей, заразились ботулизмом, — СМИ...', link_description: '🔥 Topor Live. Подписаться', link_preview: 'T' },
            ]
          }, {
            month: '6 января',
            items: [
              { id: '3', url: 'https://spusk.ru/', type: 'link', created_at: '2025-01-06T00:00:00', link_title: '"Лата Трэк"- Многофункциональный Спорти...', link_description: 'Комплекс, расположенный на западе Москвы в районе Крылатское, предназначенный как для зимнего, так и для летнего спортивно-развлека...' },
            ]
          }, {
            month: '3 января',
            items: [
              { id: '4', url: '#', type: 'link', created_at: '2025-01-03T00:00:00', link_title: '❗ Что изменилось для россиян с 1 января:', link_description: '◾ НДС вырастет с 20% до 22%, льготная ставка...\nКлуб директоров', link_preview: 'T' },
            ]
          }, {
            month: '1 января',
            items: [
              { id: '5', url: '#', type: 'link', created_at: '2025-01-01T00:00:00', link_title: 'В Парке Горького открыли долгожданную набережную', link_description: '...\nМосква 360°', link_preview: 'T' },
            ]
          }, {
            month: '29 ноября',
            items: [
              { id: '6', url: 'https://www.youtube.com/watch?v=JNU7VhFVjj8...', type: 'link', created_at: '2024-11-29T00:00:00', link_title: '⚡КТО ПОСМЕЛ ОТЛУПИТЬ ПУПСИКА?! 😡 (Сб...', link_description: 'Самое выгодное пополнение Roblox - https://bit.ly/4glHgVT\nПромокод: KARINA5 даст скидку до 5%!...' },
            ]
          });
          setMedia(mockData);
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

  // Render file item
  const renderFileItem = (item: MediaItem) => {
    const ext = item.filename?.split('.').pop() || '';
    return (
      <div key={item.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5">
        {/* File type badge or thumbnail */}
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-xs font-bold ${getFileExtensionColor(ext)}`}>
          {ext.toLowerCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{item.filename}</p>
          <p className="text-white/50 text-xs">{formatFileSize(item.filesize || 0)}</p>
          <p className="text-white/40 text-xs mt-0.5">
            {format(new Date(item.created_at), 'd MMM в HH:mm', { locale: ru })}
          </p>
        </div>
      </div>
    );
  };

  // Render voice item
  const renderVoiceItem = (item: MediaItem) => {
    return (
      <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5">
        {/* Play button */}
        <button className="w-10 h-10 rounded-full bg-[#3390ec] flex items-center justify-center flex-shrink-0">
          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">{item.sender_name}</p>
          <p className="text-white/50 text-xs">
            {format(new Date(item.created_at), 'd MMM в H:mm', { locale: ru })}, {formatDuration(item.duration || 0)}
          </p>
        </div>
      </div>
    );
  };

  // Render link item
  const renderLinkItem = (item: MediaItem) => {
    return (
      <div key={item.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5">
        {/* Preview image or letter badge */}
        {item.link_preview ? (
          <div className="w-12 h-12 rounded-lg bg-[#3390ec] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {item.link_preview}
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <ExternalLink className="w-5 h-5 text-white/60" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium line-clamp-2">{item.link_title}</p>
          <p className="text-white/50 text-xs line-clamp-2 mt-0.5">{item.link_description}</p>
          {item.url !== '#' && (
            <p className="text-[#6ab3f3] text-xs truncate mt-1">{item.url}</p>
          )}
        </div>
      </div>
    );
  };

  // Render photo grid item
  const renderPhotoItem = (item: MediaItem) => {
    return (
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
    );
  };

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
            <p>Нет {type === 'photos' ? 'фотографий' : type === 'voice' ? 'голосовых сообщений' : type === 'files' ? 'файлов' : 'ссылок'}</p>
          </div>
        ) : (
          <div className="pb-8">
            {media.map((group) => (
              <div key={group.month}>
                {/* Month Header */}
                <div className="px-4 py-3 sticky top-0 bg-[#17212b] z-10">
                  <h2 className="text-sm font-medium text-white/60">{group.month}</h2>
                </div>
                
                {/* Content based on type */}
                {type === 'photos' ? (
                  <div className="grid grid-cols-3 gap-[2px] px-[2px]">
                    {group.items.map(renderPhotoItem)}
                  </div>
                ) : type === 'files' ? (
                  <div className="divide-y divide-white/5">
                    {group.items.map(renderFileItem)}
                  </div>
                ) : type === 'voice' ? (
                  <div>
                    {group.items.map(renderVoiceItem)}
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {group.items.map(renderLinkItem)}
                  </div>
                )}
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
