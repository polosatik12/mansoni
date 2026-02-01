import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getIceServers, getMediaConstraints, clearIceServerCache } from "@/lib/webrtc-config";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type VideoCallStatus = "idle" | "calling" | "ringing" | "connected" | "ended";

export interface VideoCall {
  id: string;
  caller_id: string;
  callee_id: string;
  conversation_id: string | null;
  call_type: "video" | "audio";
  status: string;
  started_at: string | null;
  ended_at: string | null;
  caller_profile?: { display_name: string | null; avatar_url: string | null };
  callee_profile?: { display_name: string | null; avatar_url: string | null };
}

interface UseVideoCallOptions {
  onIncomingCall?: (call: VideoCall) => void;
  onCallEnded?: (call: VideoCall) => void;
}

const CALL_TIMEOUT_MS = 60000; // 60 seconds
const ICE_RESTART_DELAY_MS = 3000;
const MAX_ICE_RESTARTS = 3;
const SIGNAL_POLL_INTERVAL_MS = 1000;

export function useVideoCall(options: UseVideoCallOptions = {}) {
  const { user } = useAuth();
  const [status, setStatus] = useState<VideoCallStatus>("idle");
  const [currentCall, setCurrentCall] = useState<VideoCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionState, setConnectionState] = useState<string>("new");

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const broadcastChannelRef = useRef<RealtimeChannel | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const signalPollRef = useRef<NodeJS.Timeout | null>(null);
  const iceRestartCountRef = useRef(0);
  const isCleaningUpRef = useRef(false);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const log = useCallback((msg: string, ...args: any[]) => {
    console.log(`[VideoCall] ${msg}`, ...args);
  }, []);

  const warn = useCallback((msg: string, ...args: any[]) => {
    console.warn(`[VideoCall] ${msg}`, ...args);
  }, []);

  // Cleanup function
  const cleanup = useCallback(async () => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;
    
    log("Cleaning up...");

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (signalPollRef.current) {
      clearInterval(signalPollRef.current);
      signalPollRef.current = null;
    }

    if (broadcastChannelRef.current) {
      await supabase.removeChannel(broadcastChannelRef.current);
      broadcastChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    setRemoteStream(null);
    setStatus("idle");
    setCurrentCall(null);
    setConnectionState("new");
    setIsMuted(false);
    setIsVideoOff(false);
    iceRestartCountRef.current = 0;
    pendingCandidatesRef.current = [];
    isCleaningUpRef.current = false;
  }, [localStream, log]);

  // Send signal via both Broadcast and DB
  const sendSignal = useCallback(async (
    callId: string,
    signalType: string,
    signalData: any
  ) => {
    if (!user) return;

    // 1. Send via Broadcast (primary, low latency)
    if (broadcastChannelRef.current) {
      try {
        await broadcastChannelRef.current.send({
          type: "broadcast",
          event: "signal",
          payload: {
            from: user.id,
            type: signalType,
            data: signalData,
          },
        });
        log(`Sent ${signalType} via Broadcast`);
      } catch (err) {
        warn("Broadcast send failed:", err);
      }
    }

    // 2. Insert into DB (fallback)
    try {
      await supabase.from("video_call_signals").insert({
        call_id: callId,
        sender_id: user.id,
        signal_type: signalType,
        signal_data: signalData,
      });
      log(`Saved ${signalType} to DB`);
    } catch (err) {
      warn("DB signal insert failed:", err);
    }
  }, [user, log, warn]);

  // Process incoming signal
  const handleSignal = useCallback(async (
    signalType: string,
    signalData: any,
    fromUserId: string
  ) => {
    if (!peerConnectionRef.current) {
      log("No peer connection, ignoring signal:", signalType);
      return;
    }

    if (fromUserId === user?.id) return;

    log(`Processing ${signalType} from ${fromUserId.slice(0, 8)}`);

    try {
      switch (signalType) {
        case "offer":
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(signalData)
          );
          // Apply pending candidates
          for (const candidate of pendingCandidatesRef.current) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          }
          pendingCandidatesRef.current = [];
          
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          if (currentCall) {
            await sendSignal(currentCall.id, "answer", answer);
          }
          break;

        case "answer":
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(signalData)
          );
          // Apply pending candidates
          for (const candidate of pendingCandidatesRef.current) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          }
          pendingCandidatesRef.current = [];
          break;

        case "ice-candidate":
          if (peerConnectionRef.current.remoteDescription) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(signalData)
            );
          } else {
            // Buffer candidate
            pendingCandidatesRef.current.push(signalData);
          }
          break;

        case "hangup":
          log("Received hangup signal");
          await cleanup();
          if (currentCall) {
            options.onCallEnded?.(currentCall);
          }
          break;
      }
    } catch (err) {
      warn("Error handling signal:", err);
    }
  }, [user, currentCall, sendSignal, cleanup, log, warn, options]);

  // Poll DB for signals (fallback)
  const startSignalPolling = useCallback((callId: string) => {
    if (signalPollRef.current) {
      clearInterval(signalPollRef.current);
    }

    signalPollRef.current = setInterval(async () => {
      if (!user) return;

      const { data: signals } = await supabase
        .from("video_call_signals")
        .select("*")
        .eq("call_id", callId)
        .eq("processed", false)
        .neq("sender_id", user.id)
        .order("created_at", { ascending: true });

      if (signals && signals.length > 0) {
        for (const signal of signals) {
          await handleSignal(
            signal.signal_type,
            signal.signal_data,
            signal.sender_id
          );

          // Mark as processed
          await supabase
            .from("video_call_signals")
            .update({ processed: true })
            .eq("id", signal.id);
        }
      }
    }, SIGNAL_POLL_INTERVAL_MS);
  }, [user, handleSignal]);

  // Setup broadcast channel
  const setupBroadcastChannel = useCallback((callId: string) => {
    if (broadcastChannelRef.current) {
      supabase.removeChannel(broadcastChannelRef.current);
    }

    const channel = supabase.channel(`video-call:${callId}`, {
      config: { broadcast: { self: false } },
    });

    // Attach handlers BEFORE subscribing (critical for iOS/Safari)
    channel.on("broadcast", { event: "signal" }, ({ payload }) => {
      if (payload.from !== user?.id) {
        handleSignal(payload.type, payload.data, payload.from);
      }
    });

    channel.subscribe((status) => {
      log("Broadcast channel status:", status);
    });

    broadcastChannelRef.current = channel;
  }, [user, handleSignal, log]);

  // Create peer connection
  const createPeerConnection = useCallback(async (
    stream: MediaStream,
    callId: string,
    isInitiator: boolean
  ) => {
    log("Creating peer connection, initiator:", isInitiator);

    const config = await getIceServers();
    const pc = new RTCPeerConnection(config);

    // Add local tracks
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle remote tracks
    pc.ontrack = (event) => {
      log("Received remote track:", event.track.kind);
      if (event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(callId, "ice-candidate", event.candidate.toJSON());
      }
    };

    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      log("Connection state:", state);
      setConnectionState(state);

      if (state === "connected") {
        setStatus("connected");
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }
      } else if (state === "failed") {
        if (iceRestartCountRef.current < MAX_ICE_RESTARTS) {
          iceRestartCountRef.current++;
          log(`ICE restart attempt ${iceRestartCountRef.current}`);
          setTimeout(async () => {
            try {
              const offer = await pc.createOffer({ iceRestart: true });
              await pc.setLocalDescription(offer);
              await sendSignal(callId, "offer", offer);
            } catch (err) {
              warn("ICE restart failed:", err);
            }
          }, ICE_RESTART_DELAY_MS);
        } else {
          warn("Max ICE restarts reached, ending call");
          cleanup();
        }
      } else if (state === "disconnected") {
        // Grace period before cleanup
        setTimeout(() => {
          if (pc.connectionState === "disconnected") {
            log("Connection still disconnected after grace period");
          }
        }, 12000);
      }
    };

    pc.oniceconnectionstatechange = () => {
      log("ICE connection state:", pc.iceConnectionState);
    };

    peerConnectionRef.current = pc;

    // Create offer if initiator
    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal(callId, "offer", offer);
    }

    return pc;
  }, [sendSignal, cleanup, log, warn]);

  // Start outgoing call
  const startCall = useCallback(async (
    calleeId: string,
    conversationId: string | null,
    callType: "video" | "audio"
  ): Promise<VideoCall | null> => {
    if (!user || status !== "idle") {
      warn("Cannot start call:", { user: !!user, status });
      return null;
    }

    log("Starting call to:", calleeId.slice(0, 8));
    setStatus("calling");

    try {
      // Get media
      const constraints = getMediaConstraints(callType);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      // Create call record
      const { data: callData, error: callError } = await supabase
        .from("video_calls")
        .insert({
          caller_id: user.id,
          callee_id: calleeId,
          conversation_id: conversationId,
          call_type: callType,
          status: "ringing",
        })
        .select()
        .single();

      if (callError || !callData) {
        throw new Error(callError?.message || "Failed to create call");
      }

      const call: VideoCall = {
        ...callData,
        call_type: callType,
      };
      setCurrentCall(call);

      // Setup signaling
      setupBroadcastChannel(call.id);
      startSignalPolling(call.id);

      // Create peer connection and offer
      await createPeerConnection(stream, call.id, true);

      // Start timeout
      callTimeoutRef.current = setTimeout(async () => {
        log("Call timeout - marking as missed");
        await supabase
          .from("video_calls")
          .update({ status: "missed", ended_at: new Date().toISOString() })
          .eq("id", call.id);
        await cleanup();
      }, CALL_TIMEOUT_MS);

      return call;
    } catch (err) {
      warn("Start call error:", err);
      await cleanup();
      return null;
    }
  }, [user, status, setupBroadcastChannel, startSignalPolling, createPeerConnection, cleanup, log, warn]);

  // Answer incoming call
  const answerCall = useCallback(async (call: VideoCall) => {
    if (!user) return;

    log("Answering call:", call.id.slice(0, 8));
    setStatus("ringing");
    setCurrentCall(call);

    try {
      // Get media
      const constraints = getMediaConstraints(call.call_type);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      // Update call status
      await supabase
        .from("video_calls")
        .update({
          status: "answered",
          started_at: new Date().toISOString(),
        })
        .eq("id", call.id);

      // Setup signaling
      setupBroadcastChannel(call.id);
      startSignalPolling(call.id);

      // Create peer connection (not initiator - will wait for offer)
      await createPeerConnection(stream, call.id, false);

      // Send ready signal
      await sendSignal(call.id, "ready", { userId: user.id });
    } catch (err) {
      warn("Answer call error:", err);
      await cleanup();
    }
  }, [user, setupBroadcastChannel, startSignalPolling, createPeerConnection, sendSignal, cleanup, log, warn]);

  // Decline/End call
  const endCall = useCallback(async (reason: "declined" | "ended" = "ended") => {
    if (!currentCall) return;

    log("Ending call with reason:", reason);

    // Send hangup signal
    await sendSignal(currentCall.id, "hangup", { reason });

    // Update DB
    await supabase
      .from("video_calls")
      .update({
        status: reason,
        ended_at: new Date().toISOString(),
      })
      .eq("id", currentCall.id);

    await cleanup();
    options.onCallEnded?.(currentCall);
  }, [currentCall, sendSignal, cleanup, log, options]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, [localStream]);

  // Retry with fresh TURN credentials
  const retryWithFreshCredentials = useCallback(async () => {
    if (!currentCall || !localStream) return;

    log("Retrying with fresh TURN credentials...");
    clearIceServerCache();

    // Close current peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    iceRestartCountRef.current = 0;

    // Create new peer connection
    await createPeerConnection(
      localStream,
      currentCall.id,
      currentCall.caller_id === user?.id
    );
  }, [currentCall, localStream, user, createPeerConnection, log]);

  // NOTE: Incoming calls are handled by useIncomingCalls hook separately
  // This avoids duplicate subscriptions and race conditions

  // Subscribe to call status changes
  useEffect(() => {
    if (!currentCall) return;

    const channel = supabase
      .channel(`call-status:${currentCall.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "video_calls",
          filter: `id=eq.${currentCall.id}`,
        },
        (payload) => {
          const updated = payload.new as VideoCall;
          log("Call status updated:", updated.status);

          if (updated.status === "answered" && status === "calling") {
            setStatus("ringing");
          } else if (
            updated.status === "declined" ||
            updated.status === "ended" ||
            updated.status === "missed"
          ) {
            cleanup();
            options.onCallEnded?.(updated);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentCall, status, cleanup, log, options]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    status,
    currentCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    connectionState,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
    retryWithFreshCredentials,
  };
}
