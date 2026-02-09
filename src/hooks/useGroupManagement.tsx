import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

interface UpdateGroupData {
  name?: string;
  description?: string | null;
  avatar_url?: string | null;
}

export function useGroupManagement() {
  const { user } = useAuth();

  const updateGroup = useCallback(
    async (groupId: string, data: UpdateGroupData) => {
      if (!user) throw new Error("Not authenticated");

      const updatePayload: Record<string, unknown> = {};
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.avatar_url !== undefined) updatePayload.avatar_url = data.avatar_url;
      updatePayload.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("group_chats")
        .update(updatePayload)
        .eq("id", groupId);

      if (error) throw error;
    },
    [user]
  );

  const addMember = useCallback(
    async (groupId: string, userId: string, role = "member") => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("group_chat_members").insert({
        group_id: groupId,
        user_id: userId,
        role,
      });

      if (error) throw error;
    },
    [user]
  );

  const removeMember = useCallback(
    async (groupId: string, userId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("group_chat_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    [user]
  );

  const updateMemberRole = useCallback(
    async (groupId: string, userId: string, role: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("group_chat_members")
        .update({ role })
        .eq("group_id", groupId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    [user]
  );

  const uploadGroupAvatar = useCallback(
    async (groupId: string, file: File): Promise<string> => {
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop() || "jpg";
      const path = `groups/${groupId}/avatar_${Date.now()}.${ext}`;

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

  return { updateGroup, addMember, removeMember, updateMemberRole, uploadGroupAvatar };
}
