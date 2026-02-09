import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export type ForwardTarget =
  | { type: "dm"; conversationId: string; name: string }
  | { type: "group"; groupId: string; name: string }
  | { type: "channel"; channelId: string; name: string };

export function useForwardMessage() {
  const { user } = useAuth();

  const forwardMessage = useCallback(
    async (content: string, forwardedFrom: string, target: ForwardTarget) => {
      if (!user) return false;

      try {
        switch (target.type) {
          case "dm": {
            const { error } = await supabase.from("messages").insert({
              conversation_id: target.conversationId,
              sender_id: user.id,
              content,
              forwarded_from: forwardedFrom,
            } as any);
            if (error) throw error;

            // Bump conversation updated_at
            await supabase
              .from("conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", target.conversationId);
            break;
          }
          case "group": {
            const { error } = await supabase.from("group_chat_messages").insert({
              group_id: target.groupId,
              sender_id: user.id,
              content,
              forwarded_from: forwardedFrom,
            } as any);
            if (error) throw error;

            await supabase
              .from("group_chats")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", target.groupId);
            break;
          }
          case "channel": {
            const { error } = await supabase.from("channel_messages").insert({
              channel_id: target.channelId,
              sender_id: user.id,
              content,
              forwarded_from: forwardedFrom,
            } as any);
            if (error) throw error;
            break;
          }
        }

        toast.success(`Переслано в «${target.name}»`);
        return true;
      } catch (err) {
        console.error("Error forwarding message:", err);
        toast.error("Не удалось переслать сообщение");
        return false;
      }
    },
    [user]
  );

  return { forwardMessage };
}
