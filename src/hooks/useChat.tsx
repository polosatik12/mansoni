import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  participants: {
    user_id: string;
    profile?: {
      display_name: string | null;
      avatar_url: string | null;
    };
  }[];
  last_message?: ChatMessage;
  unread_count: number;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      // Get conversations where user is participant
      const { data: participantData, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (partError) throw partError;

      if (!participantData || participantData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = participantData.map((p) => p.conversation_id);

      // Get conversations with participants and profiles
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (convError) throw convError;

      // Get all participants for these conversations
      const { data: allParticipants, error: allPartError } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .in("conversation_id", conversationIds);

      if (allPartError) throw allPartError;

      // Get profiles for all participants
      const userIds = [...new Set(allParticipants?.map((p) => p.user_id) || [])];
      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      if (profError) throw profError;

      // Get last message for each conversation
      const { data: messages, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      if (msgError) throw msgError;

      // Get unread counts
      const { data: unreadData, error: unreadError } = await supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", conversationIds)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      if (unreadError) throw unreadError;

      const unreadCounts: Record<string, number> = {};
      unreadData?.forEach((msg) => {
        unreadCounts[msg.conversation_id] = (unreadCounts[msg.conversation_id] || 0) + 1;
      });

      // Build conversation objects
      const convs: Conversation[] = (convData || []).map((conv) => {
        const participants = (allParticipants || [])
          .filter((p) => p.conversation_id === conv.id)
          .map((p) => ({
            user_id: p.user_id,
            profile: profiles?.find((pr) => pr.user_id === p.user_id),
          }));

        const lastMessage = messages?.find((m) => m.conversation_id === conv.id);

        return {
          id: conv.id,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          participants,
          last_message: lastMessage,
          unread_count: unreadCounts[conv.id] || 0,
        };
      });

      setConversations(convs);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading, refetch: fetchConversations };
}

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    let channel: RealtimeChannel;

    const setupSubscription = () => {
      channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const newMessage = payload.new as ChatMessage;
            setMessages((prev) => [...prev, newMessage]);
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
  }, [conversationId]);

  const sendMessage = async (content: string) => {
    if (!conversationId || !user || !content.trim()) return;

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
      });

      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return { messages, loading, sendMessage, refetch: fetchMessages };
}

export function useCreateConversation() {
  const { user } = useAuth();

  const createConversation = async (otherUserId: string) => {
    if (!user) return null;

    try {
      // Create conversation
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      if (convError) throw convError;

      // Add both participants
      const { error: partError } = await supabase.from("conversation_participants").insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: otherUserId },
      ]);

      if (partError) throw partError;

      return conv.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  };

  return { createConversation };
}
