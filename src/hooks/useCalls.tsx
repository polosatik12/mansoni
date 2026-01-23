import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type CallStatus = "calling" | "ringing" | "active" | "ended" | "declined" | "missed";
export type CallType = "audio" | "video";

export interface Call {
  id: string;
  conversation_id: string;
  caller_id: string;
  callee_id: string;
  call_type: CallType;
  status: CallStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  caller_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  callee_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useCalls() {
  const { user } = useAuth();
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);

  // Subscribe to incoming calls
  useEffect(() => {
    if (!user) return;

    let channel: RealtimeChannel;

    const setupSubscription = () => {
      channel = supabase
        .channel("calls-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "calls",
            filter: `callee_id=eq.${user.id}`,
          },
          async (payload) => {
            if (payload.eventType === "INSERT") {
              const call = payload.new as Call;
              if (call.status === "calling") {
                // Fetch caller profile
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("display_name, avatar_url")
                  .eq("user_id", call.caller_id)
                  .single();

                setIncomingCall({
                  ...call,
                  caller_profile: profile || undefined,
                });

                // Auto-update to ringing
                await supabase
                  .from("calls")
                  .update({ status: "ringing" })
                  .eq("id", call.id);
              }
            } else if (payload.eventType === "UPDATE") {
              const call = payload.new as Call;
              if (call.status === "ended" || call.status === "declined" || call.status === "missed") {
                setIncomingCall(null);
                if (activeCall?.id === call.id) {
                  setActiveCall(null);
                }
              } else if (call.status === "active") {
                setActiveCall(call);
                setIncomingCall(null);
              }
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "calls",
            filter: `caller_id=eq.${user.id}`,
          },
          (payload) => {
            const call = payload.new as Call;
            if (call.status === "ended" || call.status === "declined" || call.status === "missed") {
              setActiveCall(null);
            } else if (call.status === "active") {
              setActiveCall(call);
            }
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
  }, [user, activeCall]);

  const startCall = useCallback(
    async (conversationId: string, calleeId: string, callType: CallType): Promise<Call | null> => {
      if (!user) return null;

      try {
        const { data, error } = await supabase
          .from("calls")
          .insert({
            conversation_id: conversationId,
            caller_id: user.id,
            callee_id: calleeId,
            call_type: callType,
            status: "calling",
          })
          .select()
          .single();

        if (error) throw error;

        // Fetch callee profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("user_id", calleeId)
          .single();

        const call: Call = {
          ...data,
          call_type: data.call_type as CallType,
          status: data.status as CallStatus,
          callee_profile: profile || undefined,
        };

        setActiveCall(call);
        return call;
      } catch (error) {
        console.error("Error starting call:", error);
        return null;
      }
    },
    [user]
  );

  const acceptCall = useCallback(
    async (callId: string) => {
      if (!user) return;

      try {
        await supabase
          .from("calls")
          .update({
            status: "active",
            started_at: new Date().toISOString(),
          })
          .eq("id", callId);

        if (incomingCall?.id === callId) {
          setActiveCall(incomingCall);
          setIncomingCall(null);
        }
      } catch (error) {
        console.error("Error accepting call:", error);
      }
    },
    [user, incomingCall]
  );

  const declineCall = useCallback(
    async (callId: string) => {
      if (!user) return;

      try {
        await supabase
          .from("calls")
          .update({
            status: "declined",
            ended_at: new Date().toISOString(),
          })
          .eq("id", callId);

        setIncomingCall(null);
      } catch (error) {
        console.error("Error declining call:", error);
      }
    },
    [user]
  );

  const endCall = useCallback(
    async (callId: string) => {
      if (!user) return;

      try {
        await supabase
          .from("calls")
          .update({
            status: "ended",
            ended_at: new Date().toISOString(),
          })
          .eq("id", callId);

        setActiveCall(null);
      } catch (error) {
        console.error("Error ending call:", error);
      }
    },
    [user]
  );

  return {
    activeCall,
    incomingCall,
    startCall,
    acceptCall,
    declineCall,
    endCall,
  };
}
