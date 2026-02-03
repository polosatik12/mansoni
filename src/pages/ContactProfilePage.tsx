import { MessageCircle, Bell, BellOff, Phone, Image, FileText, Link2, Mic, Users, Ban, X, User, Loader2, QrCode } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useVideoCallContext } from "@/contexts/VideoCallContext";
import { MediaGallerySheet } from "@/components/chat/MediaGallerySheet";

interface ContactProfile {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  verified: boolean | null;
  last_seen_at: string | null;
}

interface MediaStats {
  photos: number;
  files: number;
  links: number;
  voiceMessages: number;
  commonGroups: number;
}

export function ContactProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const state = location.state as { name?: string; avatar?: string; conversationId?: string } | null;
  const { startCall } = useVideoCallContext();
  
  const [profile, setProfile] = useState<ContactProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [mediaStats, setMediaStats] = useState<MediaStats>({
    photos: 0,
    files: 0,
    links: 0,
    voiceMessages: 0,
    commonGroups: 0,
  });
  const [galleryType, setGalleryType] = useState<'photos' | 'files' | 'links' | 'voice' | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  // Hydrate from navigation state immediately
  useEffect(() => {
    if (state?.name || state?.avatar) {
      setProfile({
        display_name: state.name || null,
        avatar_url: state.avatar || null,
        bio: null,
        verified: null,
        last_seen_at: null,
      });
    }
  }, [state]);

  // Fetch full profile data
  useEffect(() => {
    if (!userId) return;
    
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, bio, verified, last_seen_at')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();
        
        if (data) {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error fetching contact profile:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId]);

  // Fetch real media stats from conversation
  useEffect(() => {
    if (!state?.conversationId) {
      setMediaStats({ photos: 0, files: 0, links: 0, voiceMessages: 0, commonGroups: 0 });
      return;
    }

    const fetchMediaStats = async () => {
      try {
        // Fetch all messages with media
        const { data: messages } = await supabase
          .from('messages')
          .select('media_type, content')
          .eq('conversation_id', state.conversationId);

        if (messages) {
          const photos = messages.filter(m => m.media_type === 'image').length;
          const files = messages.filter(m => m.media_type === 'file').length;
          const voiceMessages = messages.filter(m => m.media_type === 'voice').length;
          // Count links in message content (simple URL detection)
          const links = messages.filter(m => 
            m.content && (m.content.includes('http://') || m.content.includes('https://'))
          ).length;

          setMediaStats({
            photos,
            files,
            links,
            voiceMessages,
            commonGroups: 0, // Would need separate query for groups
          });
        }
      } catch (err) {
        console.error('Error fetching media stats:', err);
      }
    };

    fetchMediaStats();
  }, [state?.conversationId]);

  const getOnlineStatus = () => {
    if (!profile?.last_seen_at) return 'был(а) недавно';
    
    const lastSeen = new Date(profile.last_seen_at);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 2) return 'онлайн';
    if (diffMins < 60) return `был(а) ${diffMins} мин. назад`;
    if (diffMins < 1440) return `был(а) ${Math.floor(diffMins / 60)} ч. назад`;
    return 'был(а) недавно';
  };

  const handleCall = async () => {
    if (userId && state?.conversationId) {
      await startCall(userId, state.conversationId, 'audio');
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-[#17212b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/25 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-violet-500/30 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {/* Header with close button */}
        <div className="flex items-center justify-end px-4 py-3 pt-safe">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Profile Section */}
        <div className="flex flex-col items-center px-4 pt-4 pb-6">
          {/* Glass Avatar */}
          <div className="relative mb-4">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-white/20 via-white/5 to-white/10 backdrop-blur-xl" />
            <Avatar className="w-24 h-24 border-2 border-white/30 relative">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'Contact'} />
              <AvatarFallback className="bg-violet-500/80 backdrop-blur-xl text-white text-3xl font-medium">
                {profile?.display_name?.charAt(0)?.toUpperCase() || <User className="w-10 h-10" />}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name & Status */}
          <h1 className="text-xl font-semibold text-white mb-1">{profile?.display_name || 'Пользователь'}</h1>
          <p className="text-sm text-white/60 mb-6">{getOnlineStatus()}</p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mb-8">
            <button 
              onClick={() => navigate(-1)}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-white/70">Чат</span>
            </button>

            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                {isMuted ? <BellOff className="w-6 h-6 text-white" /> : <Bell className="w-6 h-6 text-white" />}
              </div>
              <span className="text-xs text-white/70">Звук</span>
            </button>

            <button 
              onClick={handleCall}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-white/70">Звонок</span>
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="px-4 space-y-3">
          {/* Username Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">@{profile?.display_name?.toLowerCase().replace(/\s+/g, '_') || 'username'}</p>
                <p className="text-white/40 text-xs mt-0.5">Имя пользователя</p>
              </div>
              <QrCode className="w-6 h-6 text-white/40" />
            </div>
          </div>

          {/* Add Contact Button */}
          <button className="w-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4 text-left hover:bg-white/15 transition-colors">
            <span className="text-[#6ab3f3] font-medium">ДОБАВИТЬ КОНТАКТ</span>
          </button>

          {/* Media Stats Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
            <button 
              onClick={() => setGalleryType('photos')}
              className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/10"
            >
              <Image className="w-5 h-5 text-white/60" />
              <span className="text-white flex-1 text-left">{mediaStats.photos} фотографий</span>
            </button>
            
            <button 
              onClick={() => setGalleryType('files')}
              className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/10"
            >
              <FileText className="w-5 h-5 text-white/60" />
              <span className="text-white flex-1 text-left">{mediaStats.files} файлов</span>
            </button>
            
            <button 
              onClick={() => setGalleryType('links')}
              className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/10"
            >
              <Link2 className="w-5 h-5 text-white/60" />
              <span className="text-white flex-1 text-left">{mediaStats.links} ссылок</span>
            </button>
            
            <button 
              onClick={() => setGalleryType('voice')}
              className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/10"
            >
              <Mic className="w-5 h-5 text-white/60" />
              <span className="text-white flex-1 text-left">{mediaStats.voiceMessages} голосовых сообщений</span>
            </button>
            
            <button className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
              <Users className="w-5 h-5 text-white/60" />
              <span className="text-white flex-1 text-left">{mediaStats.commonGroups} общих групп</span>
            </button>
          </div>

          {/* Block User */}
          <button 
            onClick={() => setShowBlockModal(true)}
            className="w-full flex items-center gap-4 p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:bg-white/15 transition-colors"
          >
            <Ban className="w-5 h-5 text-red-400" />
            <span className="text-red-400">Заблокировать</span>
          </button>
        </div>

        {/* Bottom padding */}
        <div className="h-8" />
      </div>

      {/* Media Gallery Sheet */}
      <MediaGallerySheet
        isOpen={galleryType !== null}
        onClose={() => setGalleryType(null)}
        conversationId={state?.conversationId}
        userId={userId}
        title={
          galleryType === 'photos' ? 'Фотографии' :
          galleryType === 'files' ? 'Файлы' :
          galleryType === 'links' ? 'Ссылки' :
          'Голосовые сообщения'
        }
        type={galleryType || 'photos'}
      />

      {/* Block Confirmation Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBlockModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-[#1e2c3a]/95 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-lg font-semibold text-white mb-3">
              Заблокировать {profile?.display_name || 'пользователя'}
            </h2>
            <p className="text-white/70 text-sm mb-6">
              Запретить {profile?.display_name || 'пользователю'} писать Вам сообщения и звонить через Telegram?
            </p>
            
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 text-white/70 hover:text-white transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  if (!userId) return;
                  setIsBlocking(true);
                  try {
                    const { error } = await supabase
                      .from('blocked_users')
                      .insert({ blocker_id: (await supabase.auth.getUser()).data.user?.id, blocked_id: userId });
                    
                    if (!error) {
                      setShowBlockModal(false);
                      navigate(-1);
                    }
                  } catch (err) {
                    console.error('Error blocking user:', err);
                  } finally {
                    setIsBlocking(false);
                  }
                }}
                disabled={isBlocking}
                className="px-4 py-2 text-red-400 hover:text-red-300 font-medium transition-colors disabled:opacity-50"
              >
                {isBlocking ? 'Блокировка...' : 'Заблокировать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
