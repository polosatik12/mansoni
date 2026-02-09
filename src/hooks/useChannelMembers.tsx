import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export interface ChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useChannelMembers(channelId: string | null) {
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!channelId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("channel_members")
        .select("*")
        .eq("channel_id", channelId);

      if (error) throw error;

      // Fetch profiles for members
      const userIds = (data || []).map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      (profiles || []).forEach((p) => {
        profileMap[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
      });

      const membersWithProfiles = (data || []).map((m) => ({
        ...m,
        profile: profileMap[m.user_id],
      }));

      // Sort: owner first, then admins, then members
      const roleOrder: Record<string, number> = { owner: 0, admin: 1, member: 2 };
      membersWithProfiles.sort(
        (a, b) => (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3)
      );

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error("Error fetching channel members:", error);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, loading, refetch: fetchMembers };
}

export function useChannelRole(channelId: string | null) {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId || !user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from("channel_members")
          .select("role")
          .eq("channel_id", channelId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        setRole(data?.role || null);
      } catch (error) {
        console.error("Error fetching channel role:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [channelId, user]);

  const isAdmin = role === "owner" || role === "admin";
  const isOwner = role === "owner";

  return { role, isAdmin, isOwner, loading };
}
