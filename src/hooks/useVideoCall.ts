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
const SIGNAL_POLL_INTERVAL_MS = 500; // Faster polling for reliability

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
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // Track if we're in an active call process (used to prevent visibility-based cleanup)
  const isCallActiveRef = useRef(false);

  const log = useCallback((msg: string, ...args: any[]) => {
    console.log(`[VideoCall] ${msg}`, ...args);
  }, []);

  const warn = useCallback((msg: string, ...args: any[]) => {
    console.warn(`[VideoCall] ${msg}`, ...args);
  }, []);

  // Keep localStreamRef in sync
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Cleanup function with reason parameter for diagnostics
  const cleanup = useCallback(async (reason: string = "unknown") => {
    if (isCleaningUpRef.current) {
      log(`Cleanup already in progress, ignoring (reason: ${reason})`);
      return;
    }
    isCleaningUpRef.current = true;
    isCallActiveRef.current = false;
    
    log(`Cleaning up... reason: ${reason}`);

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

    // Use ref to get current stream value
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
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
  }, [log]);

  // Visibility change handler - protect against Telegram Mini App visibility events
  useEffect(() => {
    const handleVisibilityChange = () => {
      log(`Visibility changed: ${document.visibilityState}, isCallActive: ${isCallActiveRef.current}`);
      
      // Don't cleanup when page becomes hidden if we're in an active call
      // This is critical for Telegram Mini App where permission prompts trigger visibility changes
      if (document.visibilityState === "hidden" && isCallActiveRef.current) {
        log("Page hidden during active call - NOT cleaning up (Telegram Mini App protection)");
        return;
      }
      
      if (document.visibilityState === "visible" && isCallActiveRef.current) {
        log("Page visible again during active call - continuing");
      }
    };

    const handlePageHide = (event: PageTransitionEvent) => {
      log(`pagehide event, persisted: ${event.persisted}, isCallActive: ${isCallActiveRef.current}`);
      
      // Don't cleanup on pagehide if we're in an active call
      if (isCallActiveRef.current) {
        log("pagehide during active call - NOT cleaning up (Telegram Mini App protection)");
        return;
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      log(`pageshow event, persisted: ${event.persisted}, isCallActive: ${isCallActiveRef.current}`);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [log]);

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
          await cleanup("hangup_signal_received");
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
    isInitiator: boolean,
    forceRelay: boolean = false
  ) => {
    // ALWAYS force relay on iOS/Safari in Telegram to avoid ICE failures
    const isTelegramIOS = /iPhone|iPad/i.test(navigator.userAgent) && 
                          ((window as any).Telegram?.WebApp || /Telegram/i.test(navigator.userAgent));
    const shouldForceRelay = forceRelay || isTelegramIOS;
    
    log("Creating peer connection, initiator:", isInitiator, "forceRelay:", shouldForceRelay, "isTelegramIOS:", isTelegramIOS);

    const config = await getIceServers(shouldForceRelay);
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
         // If we're not already forcing relay, try a hard restart with TURN-only first.
         // This helps on Telegram iOS / restrictive NATs where STUN candidates fail.
         if (!forceRelay && iceRestartCountRef.current === 0) {
           warn("Connection failed - retrying with TURN-only (relay)");
           setTimeout(async () => {
             try {
               clearIceServerCache();
               // Recreate the whole PeerConnection with relay policy
               if (peerConnectionRef.current) {
                 peerConnectionRef.current.close();
               }
               peerConnectionRef.current = null;
               pendingCandidatesRef.current = [];
               await createPeerConnection(stream, callId, isInitiator, true);
               log("Recreated peer connection with forceRelay=true");
             } catch (err) {
               warn("Relay retry failed:", err);
             }
           }, ICE_RESTART_DELAY_MS);
           return;
         }

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
          cleanup("max_ice_restarts");
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
    isCallActiveRef.current = true; // Mark call as active BEFORE getUserMedia
    setStatus("calling");

    try {
      // Get media
      log("Requesting getUserMedia...");
      const constraints = getMediaConstraints(callType);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      log("getUserMedia SUCCESS - got stream with tracks:", stream.getTracks().length);
      setLocalStream(stream);

      // Create call record
      log("Creating call record in DB...");
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
      log("Call record created:", callData.id.slice(0, 8));

      const call: VideoCall = {
        ...callData,
        call_type: callType,
      };
      setCurrentCall(call);

      // Setup signaling
      log("Setting up broadcast channel...");
      setupBroadcastChannel(call.id);
      startSignalPolling(call.id);

      // Create peer connection and offer
      log("Creating peer connection...");
      await createPeerConnection(stream, call.id, true);
      log("Peer connection created and offer sent");

      // Start timeout
      callTimeoutRef.current = setTimeout(async () => {
        log("Call timeout - marking as missed");
        await supabase
          .from("video_calls")
          .update({ status: "missed", ended_at: new Date().toISOString() })
          .eq("id", call.id);
        await cleanup("call_timeout");
      }, CALL_TIMEOUT_MS);

      return call;
    } catch (err) {
      warn("Start call error:", err);
      isCallActiveRef.current = false;
      await cleanup("start_call_error");
      return null;
    }
  }, [user, status, setupBroadcastChannel, startSignalPolling, createPeerConnection, cleanup, log, warn]);

  // Answer incoming call
  const answerCall = useCallback(async (call: VideoCall) => {
    if (!user) return;

    log("Answering call:", call.id.slice(0, 8));
    isCallActiveRef.current = true; // Mark call as active BEFORE getUserMedia
    setStatus("ringing");
    setCurrentCall(call);

    try {
      // Get media
      log("Requesting getUserMedia for answer...");
      const constraints = getMediaConstraints(call.call_type);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      log("getUserMedia SUCCESS for answer - got stream with tracks:", stream.getTracks().length);
      setLocalStream(stream);

      // Update call status
      await supabase
        .from("video_calls")
        .update({
          status: "answered",
          started_at: new Date().toISOString(),
        })
        .eq("id", call.id);

      // Setup signaling FIRST (so we can receive offer via Broadcast)
      log("Setting up broadcast channel for answer...");
      setupBroadcastChannel(call.id);
      startSignalPolling(call.id);

      // Check if there's already an offer in the DB (likely the case since caller sends offer first)
      log("Checking for existing offer in DB...");
      const { data: existingSignals } = await supabase
        .from("video_call_signals")
        .select("*")
        .eq("call_id", call.id)
        .eq("signal_type", "offer")
        .eq("processed", false)
        .order("created_at", { ascending: false })
        .limit(1);

      // Create peer connection (not initiator - will process offer)
      log("Creating peer connection for answer...");
      await createPeerConnection(stream, call.id, false);
      log("Peer connection created for answer");

      // If offer exists in DB, process it now
      if (existingSignals && existingSignals.length > 0) {
        const offerSignal = existingSignals[0];
        log("Found existing offer in DB, processing immediately...");
        
        if (peerConnectionRef.current && offerSignal.sender_id !== user.id) {
          try {
            await peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription(offerSignal.signal_data as unknown as RTCSessionDescriptionInit)
            );
            
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);
            await sendSignal(call.id, "answer", answer);
            log("Processed existing offer and sent answer");
            
            // Mark offer as processed
            await supabase
              .from("video_call_signals")
              .update({ processed: true })
              .eq("id", offerSignal.id);
          } catch (err) {
            warn("Error processing existing offer:", err);
          }
        }
      } else {
        log("No existing offer found, will wait for offer via Broadcast/polling");
      }

      // Send ready signal (indicates we're ready to receive/process offer)
      await sendSignal(call.id, "ready", { userId: user.id });
    } catch (err) {
      warn("Answer call error:", err);
      isCallActiveRef.current = false;
      await cleanup("answer_call_error");
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

    await cleanup(`end_call_${reason}`);
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
    // Force relay on manual retry to bypass NAT/firewall issues
    await createPeerConnection(
      localStream,
      currentCall.id,
      currentCall.caller_id === user?.id,
      true
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
            cleanup("call_status_changed_to_" + updated.status);
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
      cleanup("component_unmount");
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
