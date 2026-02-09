import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ReactionGroup {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

export interface MessageReactions {
  [messageId: string]: ReactionGroup[];
}

interface ReactionRow {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

export function useMessageReactions(conversationId: string) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<MessageReactions>({});

  // Fetch all reactions for messages in this conversation
  const fetchReactions = useCallback(async () => {
    if (!conversationId) return;

    try {
      // Get all message IDs for this conversation first
      const { data: messages } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", conversationId);

      if (!messages || messages.length === 0) return;

      const messageIds = messages.map((m) => m.id);

      const { data, error } = await (supabase
        .from("message_reactions" as any)
        .select("id, message_id, user_id, emoji")
        .in("message_id", messageIds) as any);

      if (error) {
        console.error("Failed to fetch reactions:", error);
        return;
      }

      const rows = (data || []) as ReactionRow[];
      setReactions(groupReactions(rows, user?.id));
    } catch (err) {
      console.error("Error fetching reactions:", err);
    }
  }, [conversationId, user?.id]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`reactions-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        () => {
          // Refetch on any change
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchReactions]);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!user) return;

      const messageReactions = reactions[messageId] || [];
      const existing = messageReactions.find(
        (r) => r.emoji === emoji && r.hasReacted
      );

      try {
        if (existing) {
          // Remove reaction
          await (supabase
            .from("message_reactions" as any)
            .delete()
            .eq("message_id", messageId)
            .eq("user_id", user.id)
            .eq("emoji", emoji) as any);
        } else {
          // Add reaction
          await (supabase.from("message_reactions" as any).insert({
            message_id: messageId,
            user_id: user.id,
            emoji,
          }) as any);
        }

        // Optimistic update
        setReactions((prev) => {
          const current = [...(prev[messageId] || [])];
          const idx = current.findIndex((r) => r.emoji === emoji);

          if (existing && idx >= 0) {
            // Remove user from this emoji
            current[idx] = {
              ...current[idx],
              count: current[idx].count - 1,
              users: current[idx].users.filter((u) => u !== user.id),
              hasReacted: false,
            };
            if (current[idx].count <= 0) {
              current.splice(idx, 1);
            }
          } else if (idx >= 0) {
            // Add user to existing emoji
            current[idx] = {
              ...current[idx],
              count: current[idx].count + 1,
              users: [...current[idx].users, user.id],
              hasReacted: true,
            };
          } else {
            // New emoji
            current.push({
              emoji,
              count: 1,
              users: [user.id],
              hasReacted: true,
            });
          }

          return { ...prev, [messageId]: current };
        });
      } catch (err) {
        console.error("Error toggling reaction:", err);
      }
    },
    [user, reactions]
  );

  return { reactions, toggleReaction };
}

function groupReactions(
  rows: ReactionRow[],
  currentUserId?: string
): MessageReactions {
  const result: MessageReactions = {};

  for (const row of rows) {
    if (!result[row.message_id]) {
      result[row.message_id] = [];
    }

    const group = result[row.message_id];
    const existing = group.find((g) => g.emoji === row.emoji);

    if (existing) {
      existing.count += 1;
      existing.users.push(row.user_id);
      if (row.user_id === currentUserId) {
        existing.hasReacted = true;
      }
    } else {
      group.push({
        emoji: row.emoji,
        count: 1,
        users: [row.user_id],
        hasReacted: row.user_id === currentUserId,
      });
    }
  }

  return result;
}
