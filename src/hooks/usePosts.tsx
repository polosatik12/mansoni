import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Post {
  id: string;
  author_id: string;
  content: string | null;
  created_at: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_published: boolean;
  author?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  media?: {
    id: string;
    media_url: string;
    media_type: string;
    sort_order: number;
  }[];
  is_liked?: boolean;
}

// Generate a session ID for tracking views
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('view_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('view_session_id', sessionId);
  }
  return sessionId;
};

export type FeedFilter = 'all' | 'following';

export function usePosts(filter: FeedFilter = 'all') {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);

      // If filtering by following, first get the list of followed users
      let followingIds: string[] = [];
      if (filter === 'following' && user) {
        const { data: followingData } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', user.id);
        
        followingIds = followingData?.map(f => f.following_id) || [];
        
        // If user doesn't follow anyone, return empty
        if (followingIds.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }
      }
      
      // Fetch posts - first try with join
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('is_published', true)
         // Stable ordering to avoid "jumping" when rows share the same created_at
         .order('created_at', { ascending: false })
         .order('id', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;

      // Filter by following if needed
      let filteredPosts = postsData || [];
      if (filter === 'following' && followingIds.length > 0) {
        filteredPosts = filteredPosts.filter(p => followingIds.includes(p.author_id));
      }
      
      if (filteredPosts.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }
        
      // Fetch profiles separately
      const authorIds = [...new Set(filteredPosts.map(p => p.author_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', authorIds);
      
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      const postsWithAuthors = filteredPosts.map(post => ({
        ...post,
        author: profilesMap.get(post.author_id) ? {
          id: post.author_id,
          display_name: profilesMap.get(post.author_id)?.display_name,
          avatar_url: profilesMap.get(post.author_id)?.avatar_url
        } : undefined
      }));

      // Fetch media for posts
      const postIds = postsWithAuthors.map(p => p.id);
      const { data: mediaData } = await supabase
        .from('post_media')
        .select('*')
        .in('post_id', postIds)
        .order('sort_order', { ascending: true });

      const mediaMap = new Map<string, typeof mediaData>();
      mediaData?.forEach(m => {
        const existing = mediaMap.get(m.post_id) || [];
        existing.push(m);
        mediaMap.set(m.post_id, existing);
      });

      // Check if user liked posts
      let likedPostIds: string[] = [];
      if (user) {
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);
        likedPostIds = likesData?.map(l => l.post_id) || [];
      }

      const finalPosts = postsWithAuthors.map(post => ({
        ...post,
        media: mediaMap.get(post.id) || [],
        is_liked: likedPostIds.includes(post.id)
      }));

      setPosts(finalPosts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Subscribe to realtime updates for posts
  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = () => {
      channel = supabase
        .channel('posts-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'posts' },
          () => {
            fetchPosts();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'posts' },
          (payload) => {
            const updatedPost = payload.new as any;
            // Update post in place without changing order
            setPosts(prev => {
              const index = prev.findIndex(post => post.id === updatedPost.id);
              if (index === -1) return prev;
              
              // Create new array with updated post at same position
              const newPosts = [...prev];
              newPosts[index] = { 
                ...newPosts[index], 
                // Only update specific fields to prevent position jumps
                views_count: updatedPost.views_count,
                likes_count: updatedPost.likes_count,
                comments_count: updatedPost.comments_count,
                shares_count: updatedPost.shares_count,
                content: updatedPost.content,
                is_published: updatedPost.is_published
              };
              return newPosts;
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'posts' },
          (payload) => {
            const deletedPost = payload.old as any;
            setPosts(prev => prev.filter(post => post.id !== deletedPost.id));
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchPosts]);

  return { posts, loading, error, refetch: fetchPosts, setPosts };
}

export function usePostActions() {
  const { user } = useAuth();
  const [viewedPosts] = useState(new Set<string>());

  const recordView = useCallback(async (postId: string) => {
    // Prevent duplicate views in same session
    if (viewedPosts.has(postId)) return;
    
    try {
      const sessionId = getSessionId();
      
      await supabase.from('post_views').insert({
        post_id: postId,
        user_id: user?.id || null,
        session_id: sessionId
      });
      
      viewedPosts.add(postId);
    } catch (err) {
      console.error('Failed to record view:', err);
    }
  }, [user, viewedPosts]);

  const toggleLike = useCallback(async (postId: string, isCurrentlyLiked: boolean) => {
    if (!user) {
      return { error: 'Must be logged in to like posts' };
    }

    try {
      if (isCurrentlyLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
      }
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update like' };
    }
  }, [user]);

  const createPost = useCallback(async (content: string, mediaUrls?: string[]) => {
    if (!user) {
      return { error: 'Must be logged in to create posts', post: null };
    }

    try {
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({ author_id: user.id, content })
        .select()
        .single();

      if (postError) throw postError;

      // Add media if provided
      if (mediaUrls && mediaUrls.length > 0) {
        const mediaInserts = mediaUrls.map((url, index) => ({
          post_id: post.id,
          media_url: url,
          media_type: url.includes('.mp4') || url.includes('.webm') ? 'video' : 'image',
          sort_order: index
        }));

        await supabase.from('post_media').insert(mediaInserts);
      }

      return { error: null, post };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to create post', post: null };
    }
  }, [user]);

  return { recordView, toggleLike, createPost };
}
