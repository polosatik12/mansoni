import { Grid3X3, Bookmark, Play, MessageCircle, Phone, Video, Mail, User, Loader2, ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { supabase } from "@/integrations/supabase/client";

const tabs = [
  { id: "posts", label: "Публикации", icon: Grid3X3 },
  { id: "saved", label: "Медиа", icon: Bookmark },
];

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

interface ContactProfile {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  verified: boolean | null;
}

export function ContactProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const state = location.state as { name?: string; avatar?: string } | null;
  
  const [profile, setProfile] = useState<ContactProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [stats, setStats] = useState({ postsCount: 0, followersCount: 0, followingCount: 0 });

  // Hydrate from navigation state immediately
  useEffect(() => {
    if (state?.name || state?.avatar) {
      setProfile({
        display_name: state.name || null,
        avatar_url: state.avatar || null,
        bio: null,
        verified: null,
      });
    }
  }, [state]);

  // Fetch full profile data
  useEffect(() => {
    if (!userId) return;
    
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, bio, verified')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();
        
        if (data) {
          setProfile(data);
        }
        
        // Fetch stats
        const [postsRes, followersRes, followingRes] = await Promise.all([
          supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userId),
          supabase.from('followers').select('id', { count: 'exact', head: true }).eq('following_id', userId),
          supabase.from('followers').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
        ]);
        
        setStats({
          postsCount: postsRes.count || 0,
          followersCount: followersRes.count || 0,
          followingCount: followingRes.count || 0,
        });
      } catch (err) {
        console.error('Error fetching contact profile:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId]);

  // Fetch posts
  useEffect(() => {
    if (!userId || activeTab !== 'posts') return;
    
    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const { data } = await supabase
          .from('posts')
          .select('id, post_media(media_url, media_type)')
          .eq('author_id', userId)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(30);
        
        setPosts(data || []);
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setPostsLoading(false);
      }
    };
    
    fetchPosts();
  }, [userId, activeTab]);

  const getPostImage = (post: any): string | null => {
    if (post.post_media && post.post_media.length > 0) {
      return post.post_media[0].media_url;
    }
    return null;
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/25 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-violet-500/30 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Content */}
      <div className="relative z-10 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 pt-safe">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-sm font-medium">
            Контакт
          </div>
        </div>

        {/* Profile Hero Section */}
        <div className="flex flex-col items-center px-4 pt-8 pb-6">
          {/* Large Glass Avatar */}
          <div className="relative mb-6">
            {/* Outer glass ring */}
            <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-white/30 via-white/10 to-white/5 backdrop-blur-xl border border-white/30" />
            {/* Inner glass ring */}
            <div className="absolute -inset-1.5 rounded-full bg-white/10 backdrop-blur-md" />
            {/* Avatar */}
            <Avatar className="w-32 h-32 border-2 border-white/40 relative">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'Contact'} />
              <AvatarFallback className="bg-white/20 backdrop-blur-xl text-white text-4xl font-light">
                {profile?.display_name?.charAt(0)?.toUpperCase() || <User className="w-12 h-12" />}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name */}
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-semibold text-white">{profile?.display_name || 'Пользователь'}</h1>
            {profile?.verified && <VerifiedBadge size="lg" />}
          </div>

          {/* Bio */}
          {profile?.bio && (
            <p className="text-white/70 text-center text-sm max-w-xs mb-4">{profile.bio}</p>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{stats.postsCount}</p>
              <p className="text-xs text-white/60">публикаций</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{formatNumber(stats.followersCount)}</p>
              <p className="text-xs text-white/60">подписчиков</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{formatNumber(stats.followingCount)}</p>
              <p className="text-xs text-white/60">подписок</p>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => navigate(-1)}
              className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </button>
            <button className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 flex items-center justify-center hover:bg-white/25 transition-colors">
              <Phone className="w-5 h-5 text-white" />
            </button>
            <button className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 flex items-center justify-center hover:bg-white/25 transition-colors">
              <Video className="w-5 h-5 text-white" />
            </button>
            <button className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 flex items-center justify-center hover:bg-white/25 transition-colors">
              <Mail className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Glass Tabs */}
        <div className="flex justify-center gap-2 px-4 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-white/25 backdrop-blur-xl border border-white/40 text-white shadow-lg"
                  : "bg-white/10 backdrop-blur-xl border border-white/20 text-white/70 hover:bg-white/15"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Cards */}
        <div className="px-4">
          {/* Glass Card Container */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden min-h-[300px]">
            {activeTab === "posts" && (
              <>
                {postsLoading ? (
                  <div className="p-12 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white/60" />
                  </div>
                ) : posts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-[1px]">
                    {posts.map((post) => {
                      const imageUrl = getPostImage(post);
                      const isVideo = post.post_media?.[0]?.media_type === 'video';
                      return (
                        <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden bg-white/5">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={`Post ${post.id}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Grid3X3 className="w-6 h-6 text-white/40" />
                            </div>
                          )}
                          {isVideo && (
                            <div className="absolute top-2 right-2">
                              <Play className="w-5 h-5 text-white fill-white drop-shadow-lg" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center mx-auto mb-3">
                      <Grid3X3 className="w-8 h-8 text-white/60" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">Нет публикаций</h3>
                    <p className="text-sm text-white/60">У этого пользователя пока нет постов</p>
                  </div>
                )}
              </>
            )}

            {activeTab === "saved" && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center mx-auto mb-3">
                  <Bookmark className="w-8 h-8 text-white/60" />
                </div>
                <h3 className="font-semibold text-white mb-1">Медиафайлы</h3>
                <p className="text-sm text-white/60">Общие фото и видео</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
