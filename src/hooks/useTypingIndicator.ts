import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const TYPING_TIMEOUT_MS = 3000;
const THROTTLE_MS = 2000;

interface PresenceState {
  user_id: string;
  display_name: string;
  is_typing: boolean;
}

export function useTypingIndicator(
  channelName: string,
  userId: string | undefined,
  displayName: string
) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTrackRef = useRef<number>(0);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!userId || !channelName) return;

    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceState>();
        const typing: string[] = [];

        for (const key of Object.keys(state)) {
          if (key === userId) continue;
          const presences = state[key];
          if (presences && presences.length > 0) {
            const latest = presences[presences.length - 1];
            if (latest.is_typing) {
              typing.push(latest.display_name || "Аноним");
            }
          }
        }

        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          isSubscribedRef.current = true;
          await channel.track({
            user_id: userId,
            display_name: displayName,
            is_typing: false,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      isSubscribedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      channel.untrack().then(() => {
        supabase.removeChannel(channel);
      });
      channelRef.current = null;
    };
  }, [channelName, userId, displayName]);

  const sendTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !userId || !isSubscribedRef.current) return;

    const now = Date.now();
    if (now - lastTrackRef.current < THROTTLE_MS) return;
    lastTrackRef.current = now;

    channel.track({
      user_id: userId,
      display_name: displayName,
      is_typing: true,
    });

    // Auto-reset after timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (channelRef.current && isSubscribedRef.current) {
        channelRef.current.track({
          user_id: userId,
          display_name: displayName,
          is_typing: false,
        });
      }
      timeoutRef.current = null;
    }, TYPING_TIMEOUT_MS);
  }, [userId, displayName]);

  const stopTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !userId || !isSubscribedRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    lastTrackRef.current = 0; // Reset throttle so next keystroke can fire immediately

    channel.track({
      user_id: userId,
      display_name: displayName,
      is_typing: false,
    });
  }, [userId, displayName]);

  return { sendTyping, stopTyping, typingUsers };
}

/**
 * Format typing users into a localized string.
 * - 1 user: "Имя печатает..."
 * - 2+ users: "2 печатают..."
 */
export function formatTypingText(users: string[]): string {
  if (users.length === 0) return "";
  if (users.length === 1) return `${users[0]} печатает...`;
  return `${users.length} печатают...`;
}
