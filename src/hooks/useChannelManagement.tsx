import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

interface UpdateChannelData {
  name?: string;
  description?: string | null;
  avatar_url?: string | null;
}

export function useChannelManagement() {
  const { user } = useAuth();

  const updateChannel = useCallback(
    async (channelId: string, data: UpdateChannelData) => {
      if (!user) throw new Error("Not authenticated");

      const updatePayload: Record<string, unknown> = {};
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.avatar_url !== undefined) updatePayload.avatar_url = data.avatar_url;
      updatePayload.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("channels")
        .update(updatePayload)
        .eq("id", channelId);

      if (error) throw error;
    },
    [user]
  );

  const addMember = useCallback(
    async (channelId: string, userId: string, role = "member") => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("channel_members").insert({
        channel_id: channelId,
        user_id: userId,
        role,
      });

      if (error) throw error;
    },
    [user]
  );

  const removeMember = useCallback(
    async (channelId: string, userId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("channel_members")
        .delete()
        .eq("channel_id", channelId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    [user]
  );

  const updateMemberRole = useCallback(
    async (channelId: string, userId: string, role: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("channel_members")
        .update({ role })
        .eq("channel_id", channelId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    [user]
  );

  const uploadChannelAvatar = useCallback(
    async (channelId: string, file: File): Promise<string> => {
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop() || "jpg";
      const path = `channels/${channelId}/avatar_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-media")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("chat-media")
        .getPublicUrl(path);

      return urlData.publicUrl;
    },
    [user]
  );

  return { updateChannel, addMember, removeMember, updateMemberRole, uploadChannelAvatar };
}
