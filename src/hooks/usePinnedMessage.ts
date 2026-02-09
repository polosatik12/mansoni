import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PinnedMessage {
  id: string;
  content: string;
  sender_name: string;
}

/**
 * Hook for managing pinned messages in DM conversations.
 * Reads pinned_message_id from the conversations table.
 */
export function usePinnedMessage(conversationId: string | null) {
  const [pinnedMessage, setPinnedMessage] = useState<PinnedMessage | null>(null);

  const fetchPinned = useCallback(async () => {
    if (!conversationId) {
      setPinnedMessage(null);
      return;
    }

    try {
      const { data: conv, error } = await supabase
        .from("conversations")
        .select("pinned_message_id")
        .eq("id", conversationId)
        .single();

      if (error || !conv?.pinned_message_id) {
        setPinnedMessage(null);
        return;
      }

      // Fetch the actual message content
      const { data: msg, error: msgError } = await supabase
        .from("messages")
        .select("id, content, sender_id")
        .eq("id", conv.pinned_message_id)
        .single();

      if (msgError || !msg) {
        setPinnedMessage(null);
        return;
      }

      // Fetch sender profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", msg.sender_id)
        .single();

      setPinnedMessage({
        id: msg.id,
        content: msg.content,
        sender_name: profile?.display_name || "Аноним",
      });
    } catch (err) {
      console.error("Error fetching pinned message:", err);
      setPinnedMessage(null);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchPinned();
  }, [fetchPinned]);

  const pinMessage = useCallback(
    async (messageId: string) => {
      if (!conversationId) return;

      try {
        const { error } = await supabase
          .from("conversations")
          .update({ pinned_message_id: messageId } as any)
          .eq("id", conversationId);

        if (error) throw error;
        await fetchPinned();
        toast.success("Сообщение закреплено");
      } catch (err) {
        console.error("Error pinning message:", err);
        toast.error("Не удалось закрепить сообщение");
      }
    },
    [conversationId, fetchPinned]
  );

  const unpinMessage = useCallback(async () => {
    if (!conversationId) return;

    try {
      const { error } = await supabase
        .from("conversations")
        .update({ pinned_message_id: null } as any)
        .eq("id", conversationId);

      if (error) throw error;
      setPinnedMessage(null);
      toast.success("Сообщение откреплено");
    } catch (err) {
      console.error("Error unpinning message:", err);
      toast.error("Не удалось открепить сообщение");
    }
  }, [conversationId]);

  return { pinnedMessage, pinMessage, unpinMessage };
}

/**
 * Hook for managing pinned messages in channels.
 * Reads pinned_message_id from the channels table.
 */
export function useChannelPinnedMessage(channelId: string | null) {
  const [pinnedMessage, setPinnedMessage] = useState<PinnedMessage | null>(null);

  const fetchPinned = useCallback(async () => {
    if (!channelId) {
      setPinnedMessage(null);
      return;
    }

    try {
      const { data: ch, error } = await supabase
        .from("channels")
        .select("pinned_message_id")
        .eq("id", channelId)
        .single();

      if (error || !ch?.pinned_message_id) {
        setPinnedMessage(null);
        return;
      }

      // Fetch the actual message content
      const { data: msg, error: msgError } = await supabase
        .from("channel_messages")
        .select("id, content, sender_id")
        .eq("id", ch.pinned_message_id)
        .single();

      if (msgError || !msg) {
        setPinnedMessage(null);
        return;
      }

      // Fetch sender profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", msg.sender_id)
        .single();

      setPinnedMessage({
        id: msg.id,
        content: msg.content,
        sender_name: profile?.display_name || "Аноним",
      });
    } catch (err) {
      console.error("Error fetching channel pinned message:", err);
      setPinnedMessage(null);
    }
  }, [channelId]);

  useEffect(() => {
    fetchPinned();
  }, [fetchPinned]);

  const pinMessage = useCallback(
    async (messageId: string) => {
      if (!channelId) return;

      try {
        const { error } = await supabase
          .from("channels")
          .update({ pinned_message_id: messageId } as any)
          .eq("id", channelId);

        if (error) throw error;
        await fetchPinned();
        toast.success("Сообщение закреплено");
      } catch (err) {
        console.error("Error pinning channel message:", err);
        toast.error("Не удалось закрепить сообщение");
      }
    },
    [channelId, fetchPinned]
  );

  const unpinMessage = useCallback(async () => {
    if (!channelId) return;

    try {
      const { error } = await supabase
        .from("channels")
        .update({ pinned_message_id: null } as any)
        .eq("id", channelId);

      if (error) throw error;
      setPinnedMessage(null);
      toast.success("Сообщение откреплено");
    } catch (err) {
      console.error("Error unpinning channel message:", err);
      toast.error("Не удалось открепить сообщение");
    }
  }, [channelId]);

  return { pinnedMessage, pinMessage, unpinMessage };
}
