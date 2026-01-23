import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
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

const CALL_TIMEOUT_MS = 30000; // 30 seconds

export function useCalls() {
  const { user } = useAuth();
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const missedCallTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeCallIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeCallIdRef.current = activeCall?.id ?? null;
  }, [activeCall?.id]);

  // Clear missed call timer
  const clearMissedCallTimer = useCallback(() => {
    if (missedCallTimerRef.current) {
      clearTimeout(missedCallTimerRef.current);
      missedCallTimerRef.current = null;
    }
  }, []);

  // Start missed call timer
  const startMissedCallTimer = useCallback((callId: string) => {
    clearMissedCallTimer();
    
    missedCallTimerRef.current = setTimeout(async () => {
      console.log("[Calls] Missed call timer expired for:", callId);
      try {
        // Check if call is still pending
        const { data } = await supabase
          .from("calls")
          .select("status")
          .eq("id", callId)
          .single();
        
        if (data && (data.status === "calling" || data.status === "ringing")) {
          await supabase
            .from("calls")
            .update({ 
              status: "missed", 
              ended_at: new Date().toISOString() 
            })
            .eq("id", callId);
          
          setActiveCall(null);
        }
      } catch (error) {
        console.error("[Calls] Error marking call as missed:", error);
      }
    }, CALL_TIMEOUT_MS);
  }, [clearMissedCallTimer]);

  // Subscribe to incoming calls and call updates
  useEffect(() => {
    if (!user) return;

    let channel: RealtimeChannel;

    const setupSubscription = () => {
      console.log("[Calls] Setting up realtime subscription for user:", user.id);
      
      channel = supabase
        .channel(`calls-realtime:${user.id}`)
        // Listen for calls where user is the callee (incoming calls)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "calls",
            filter: `callee_id=eq.${user.id}`,
          },
          async (payload) => {
            console.log("[Calls] Received callee event:", payload.eventType, payload.new);
            
            if (payload.eventType === "INSERT") {
              const call = payload.new as Call;
              if (call.status === "calling") {
                // Fetch caller profile
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("display_name, avatar_url")
                  .eq("user_id", call.caller_id)
                  .single();

                console.log("[Calls] Incoming call from:", profile?.display_name);

                setIncomingCall({
                  ...call,
                  call_type: call.call_type as CallType,
                  status: call.status as CallStatus,
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
                if (activeCallIdRef.current === call.id) {
                  setActiveCall(null);
                  clearMissedCallTimer();
                }
              } else if (call.status === "active") {
                // Update active call for callee
                setActiveCall(prev => prev ? {
                  ...prev,
                  status: "active" as CallStatus,
                  started_at: call.started_at,
                } : null);
                setIncomingCall(null);
                clearMissedCallTimer();
              }
            }
          }
        )
        // Listen for calls where user is the caller (outgoing call updates)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "calls",
            filter: `caller_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("[Calls] Received caller event:", payload.eventType, payload.new);
            const call = payload.new as Call;
            
            if (call.status === "ended" || call.status === "declined" || call.status === "missed") {
              setActiveCall(null);
              clearMissedCallTimer();
            } else if (call.status === "ringing") {
              console.log("[Calls] Call is now ringing");
              // Update status to ringing for initiator
              setActiveCall(prev => prev ? {
                ...prev,
                status: "ringing" as CallStatus,
              } : null);
            } else if (call.status === "active") {
              console.log("[Calls] Call is now active");
              // Update status to active for initiator
              setActiveCall(prev => prev ? {
                ...prev,
                status: "active" as CallStatus,
                started_at: call.started_at,
              } : null);
              clearMissedCallTimer();
            }
          }
        )
        .subscribe((status) => {
          console.log("[Calls] Subscription status:", status);
        });
    };

    setupSubscription();

    return () => {
      console.log("[Calls] Cleaning up subscription");
      if (channel) {
        supabase.removeChannel(channel);
      }
      clearMissedCallTimer();
    };
  }, [user, clearMissedCallTimer]);

  const startCall = useCallback(
    async (conversationId: string, calleeId: string, callType: CallType): Promise<Call | null> => {
      if (!user) return null;

      console.log("[Calls] Starting call:", { conversationId, calleeId, callType });

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

        console.log("[Calls] Call created:", call.id);
        setActiveCall(call);
        
        // Start missed call timer
        startMissedCallTimer(call.id);
        
        return call;
      } catch (error) {
        console.error("[Calls] Error starting call:", error);
        return null;
      }
    },
    [user, startMissedCallTimer]
  );

  const acceptCall = useCallback(
    async (callId: string) => {
      if (!user) return;

      console.log("[Calls] Accepting call:", callId);

      try {
        await supabase
          .from("calls")
          .update({
            status: "active",
            started_at: new Date().toISOString(),
          })
          .eq("id", callId);

        if (incomingCall?.id === callId) {
          setActiveCall({
            ...incomingCall,
            status: "active" as CallStatus,
            started_at: new Date().toISOString(),
          });
          setIncomingCall(null);
        }
        
        clearMissedCallTimer();
      } catch (error) {
        console.error("[Calls] Error accepting call:", error);
      }
    },
    [user, incomingCall, clearMissedCallTimer]
  );

  const declineCall = useCallback(
    async (callId: string) => {
      if (!user) return;

      console.log("[Calls] Declining call:", callId);

      try {
        await supabase
          .from("calls")
          .update({
            status: "declined",
            ended_at: new Date().toISOString(),
          })
          .eq("id", callId);

        setIncomingCall(null);
        clearMissedCallTimer();
      } catch (error) {
        console.error("[Calls] Error declining call:", error);
      }
    },
    [user, clearMissedCallTimer]
  );

  const endCall = useCallback(
    async (callId: string) => {
      if (!user) return;

      console.log("[Calls] Ending call:", callId);

      try {
        await supabase
          .from("calls")
          .update({
            status: "ended",
            ended_at: new Date().toISOString(),
          })
          .eq("id", callId);

        setActiveCall(null);
        clearMissedCallTimer();
      } catch (error) {
        console.error("[Calls] Error ending call:", error);
      }
    },
    [user, clearMissedCallTimer]
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
