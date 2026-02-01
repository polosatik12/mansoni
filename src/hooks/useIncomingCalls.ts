import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { VideoCall } from "./useVideoCall";

interface UseIncomingCallsOptions {
  onIncomingCall?: (call: VideoCall) => void;
}

export function useIncomingCalls(options: UseIncomingCallsOptions = {}) {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<VideoCall | null>(null);
  
  // Use ref to avoid recreating subscription when callback changes
  const onIncomingCallRef = useRef(options.onIncomingCall);
  onIncomingCallRef.current = options.onIncomingCall;

  const clearIncomingCall = useCallback(() => {
    console.log("[IncomingCalls] Clearing incoming call");
    setIncomingCall(null);
  }, []);

  useEffect(() => {
    if (!user) return;

    console.log("[IncomingCalls] Subscribing for user:", user.id.slice(0, 8));

    const channel = supabase
      .channel(`incoming-video-calls-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "video_calls",
          filter: `callee_id=eq.${user.id}`,
        },
        async (payload) => {
          const call = payload.new as VideoCall;
          
          if (call.status !== "ringing") return;
          
          console.log("[IncomingCalls] Incoming call:", call.id.slice(0, 8));

          // Fetch caller profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("user_id", call.caller_id)
            .single();

          const callWithProfile: VideoCall = {
            ...call,
            call_type: call.call_type as "video" | "audio",
            caller_profile: profile || undefined,
          };

          setIncomingCall(callWithProfile);
          onIncomingCallRef.current?.(callWithProfile);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "video_calls",
          filter: `callee_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as VideoCall;
          
          // Clear incoming call if it was answered, declined, ended, or missed
          if (["answered", "declined", "ended", "missed"].includes(updated.status)) {
            console.log("[IncomingCalls] Call status changed to:", updated.status);
            setIncomingCall((current) => {
              if (current?.id === updated.id) {
                return null;
              }
              return current;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("[IncomingCalls] Subscription status:", status);
      });

    return () => {
      console.log("[IncomingCalls] Unsubscribing");
      supabase.removeChannel(channel);
    };
  }, [user]); // Only depend on user, not on callback

  return {
    incomingCall,
    clearIncomingCall,
  };
}
