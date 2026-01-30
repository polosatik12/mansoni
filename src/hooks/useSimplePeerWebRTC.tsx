import { useState, useEffect, useRef, useCallback } from "react";
import Peer from "simple-peer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { CallType } from "./useCalls";

// Environment-based relay mode (set VITE_FORCE_RELAY=true to force TURN only)
const FORCE_RELAY = import.meta.env.VITE_FORCE_RELAY === "true";

// Default fallback ICE servers
const DEFAULT_ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// Fetch Cloudflare TURN credentials from edge function
async function getIceServers(): Promise<RTCIceServer[]> {
  try {
    const ts = Date.now();
    console.log(`[WebRTC] [${ts}] Fetching TURN credentials...`);
    const { data, error } = await supabase.functions.invoke("turn-credentials");
    
    if (error) {
      console.error(`[WebRTC] [${Date.now()}] Error fetching TURN credentials:`, error);
      return DEFAULT_ICE_CONFIG.iceServers!;
    }

    console.log(`[WebRTC] [${Date.now()}] TURN response received (took ${Date.now() - ts}ms)`);

    const iceServers = data?.iceServers;
    
    if (iceServers && Array.isArray(iceServers) && iceServers.length > 0) {
      console.log(`[WebRTC] Got ${iceServers.length} ICE servers from Cloudflare`);
      return [
        { urls: "stun:stun.l.google.com:19302" },
        ...iceServers,
      ];
    }

    console.warn("[WebRTC] No ICE servers in response, using defaults");
    return DEFAULT_ICE_CONFIG.iceServers!;
  } catch (error) {
    console.error("[WebRTC] Failed to fetch TURN credentials:", error);
    return DEFAULT_ICE_CONFIG.iceServers!;
  }
}

interface UseSimplePeerOptions {
  callId: string | null;
  callType: CallType;
  isInitiator: boolean;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onConnectionFailed?: () => void;
}

// Connection status for UI
export type WebRTCStatus = 
  | "idle"
  | "getting_media"
  | "subscribing"
  | "waiting_ready"
  | "exchanging_signals"
  | "ice_connecting"
  | "connected"
  | "failed";

// Constants for timing
const READY_TIMEOUT_MS = 10000;
const CONNECTION_TIMEOUT_MS = 25000;
const RETRY_DELAY_MS = 1500;
const MAX_RETRIES = 2;

export function useSimplePeerWebRTC({
  callId,
  callType,
  isInitiator,
  onRemoteStream,
  onConnectionStateChange,
  onConnectionFailed,
}: UseSimplePeerOptions) {
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<WebRTCStatus>("idle");

  const peerRef = useRef<Peer.Instance | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const readyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);
  const retryCountRef = useRef(0);
  const pendingSignalsRef = useRef<any[]>([]);
  const peerReadyRef = useRef(false);
  const remoteReadyRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceServersRef = useRef<RTCIceServer[] | null>(null);
  const signalListenerAttachedRef = useRef(false);
  const isStartingRef = useRef(false);

  // Track connection state with ref for timeout callback
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  // Get local media stream (can be called early)
  const getLocalStream = useCallback(async () => {
    // Return cached stream if available
    if (localStreamRef.current) {
      console.log("[WebRTC] Using cached local stream");
      return localStreamRef.current;
    }

    try {
      const ts = Date.now();
      console.log(`[WebRTC] [${ts}] Requesting media access (${callType})...`);
      setConnectionStatus("getting_media");
      
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callType === "video" 
          ? { 
              facingMode: "user",
              width: { ideal: 640, max: 1280 },
              height: { ideal: 480, max: 720 },
            } 
          : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log(`[WebRTC] [${Date.now()}] Got local stream (took ${Date.now() - ts}ms), tracks:`, 
        stream.getTracks().map(t => `${t.kind}:${t.readyState}`));
      
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error("[WebRTC] Error getting local stream:", error);
      return null;
    }
  }, [callType]);

  // Apply any pending signals to the peer
  const flushPendingSignals = useCallback((peer: Peer.Instance) => {
    if (pendingSignalsRef.current.length > 0) {
      console.log(`[WebRTC] Flushing ${pendingSignalsRef.current.length} pending signals`);
      pendingSignalsRef.current.forEach((signalData, idx) => {
        try {
          console.log(`[WebRTC] Applying buffered signal ${idx + 1}:`, signalData.type || "candidate");
          peer.signal(signalData);
        } catch (error) {
          console.error("[WebRTC] Error applying pending signal:", error);
        }
      });
      pendingSignalsRef.current = [];
    }
  }, []);

  // Create peer connection
  const createPeer = useCallback(
    async (stream: MediaStream, channel: ReturnType<typeof supabase.channel>) => {
      // Get ICE servers (cache them)
      if (!iceServersRef.current) {
        iceServersRef.current = await getIceServers();
      }
      const iceServers = iceServersRef.current;
      
      const config: RTCConfiguration = {
        iceServers: iceServers,
      };
      
      // Force relay mode if enabled (for NAT/firewall debugging)
      if (FORCE_RELAY) {
        config.iceTransportPolicy = "relay";
        console.log("[WebRTC] ⚠️ FORCE_RELAY enabled - using TURN servers only");
      }
      
      console.log(`[WebRTC] [${Date.now()}] Creating peer, initiator: ${isInitiator}, ICE servers: ${iceServers.length}, relay-only: ${FORCE_RELAY}`);
      
      const peer = new Peer({
        initiator: isInitiator,
        trickle: true,
        stream: stream,
        config: config,
      });

      // Handle signals (SDP offers/answers and ICE candidates)
      peer.on("signal", async (signalData) => {
        const signalType = signalData.type || "candidate";
        const signalSize = JSON.stringify(signalData).length;
        console.log(`[WebRTC] [${Date.now()}] Signal generated: ${signalType}, size: ${signalSize} bytes`);
        
        setConnectionStatus("exchanging_signals");
        
        if (channel && user) {
          try {
            const result = await channel.send({
              type: "broadcast",
              event: "signal",
              payload: {
                signalData,
                from: user.id,
                timestamp: Date.now(),
              },
            });
            console.log(`[WebRTC] Signal sent (${signalType}), broadcast result:`, result);
          } catch (error) {
            console.error("[WebRTC] ❌ Error sending signal:", error);
          }
        }
      });

      // Handle incoming stream
      peer.on("stream", (remoteMediaStream) => {
        console.log(`[WebRTC] [${Date.now()}] Received remote stream with ${remoteMediaStream.getTracks().length} tracks`);
        setRemoteStream(remoteMediaStream);
        onRemoteStream?.(remoteMediaStream);
      });

      // Handle connection
      peer.on("connect", () => {
        console.log(`[WebRTC] [${Date.now()}] ✅ DATA CHANNEL CONNECTED!`);
        setIsConnected(true);
        setConnectionStatus("connected");
        onConnectionStateChange?.("connected");
        
        // Clear all timeouts on success
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        if (readyTimeoutRef.current) {
          clearTimeout(readyTimeoutRef.current);
          readyTimeoutRef.current = null;
        }
      });

      // Handle errors
      peer.on("error", (error) => {
        console.error(`[WebRTC] [${Date.now()}] ❌ Peer error:`, error.message);
        setConnectionStatus("failed");
        onConnectionStateChange?.("failed");
      });

      // Handle close
      peer.on("close", () => {
        console.log(`[WebRTC] [${Date.now()}] Connection closed`);
        setIsConnected(false);
        onConnectionStateChange?.("closed" as RTCPeerConnectionState);
      });

      // Handle ICE connection state for debugging
      peer.on("iceStateChange", (iceConnectionState: string) => {
        console.log(`[WebRTC] [${Date.now()}] ICE state: ${iceConnectionState}`);
        if (iceConnectionState === "checking" || iceConnectionState === "connected") {
          setConnectionStatus("ice_connecting");
        }
      });

      peerRef.current = peer;
      peerReadyRef.current = true;
      
      // Flush any pending signals that arrived before peer was ready
      flushPendingSignals(peer);
      
      return peer;
    },
    [isInitiator, user, onRemoteStream, onConnectionStateChange, flushPendingSignals]
  );

  // Setup signaling channel with signal listener attached IMMEDIATELY
  const setupSignaling = useCallback(async () => {
    if (!callId || !user) return null;

    const ts = Date.now();
    console.log(`[WebRTC] [${ts}] Setting up signaling channel call:${callId}, role: ${isInitiator ? "initiator" : "callee"}`);
    setConnectionStatus("subscribing");

    const channel = supabase.channel(`call:${callId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    // CRITICAL: Attach signal listener BEFORE subscribing
    // This ensures we NEVER miss any signals, even if they arrive instantly after subscribe
    if (!signalListenerAttachedRef.current) {
      channel.on("broadcast", { event: "signal" }, ({ payload }) => {
        if (payload.from === user.id) return;
        
        const signalType = payload.signalData?.type || "candidate";
        const signalTs = payload.timestamp || "unknown";
        console.log(`[WebRTC] [${Date.now()}] 📥 Received signal: ${signalType} (sent at ${signalTs})`);
        
        // If peer exists and ready, apply signal directly; otherwise buffer it
        if (peerRef.current && peerReadyRef.current) {
          try {
            peerRef.current.signal(payload.signalData);
            console.log(`[WebRTC] Signal applied to peer: ${signalType}`);
          } catch (error) {
            console.error("[WebRTC] Error processing signal:", error);
          }
        } else {
          console.log(`[WebRTC] Peer not ready, buffering signal (${signalType}). Buffer size: ${pendingSignalsRef.current.length + 1}`);
          pendingSignalsRef.current.push(payload.signalData);
        }
      });
      
      signalListenerAttachedRef.current = true;
    }

    // Subscribe and wait for SUBSCRIBED status with error handling
    const subscribed = await new Promise<boolean>((resolve) => {
      const subscribeTimeout = setTimeout(() => {
        console.error(`[WebRTC] [${Date.now()}] ❌ Channel subscribe timeout after 10s`);
        resolve(false);
      }, 10000);
      
      channel.subscribe((status, err) => {
        console.log(`[WebRTC] [${Date.now()}] Channel status: ${status} (took ${Date.now() - ts}ms)`, err || "");
        
        if (status === "SUBSCRIBED") {
          clearTimeout(subscribeTimeout);
          resolve(true);
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          clearTimeout(subscribeTimeout);
          console.error(`[WebRTC] ❌ Channel error: ${status}`, err);
          resolve(false);
        }
      });
    });

    if (!subscribed) {
      console.error("[WebRTC] Failed to subscribe to signaling channel");
      supabase.removeChannel(channel);
      return null;
    }

    console.log(`[WebRTC] [${Date.now()}] ✅ Signaling channel SUBSCRIBED`);
    channelRef.current = channel;
    return channel;
  }, [callId, user, isInitiator]);

  // Send ready event
  const sendReady = useCallback(async (channel: ReturnType<typeof supabase.channel>) => {
    if (!user) return;
    
    const ts = Date.now();
    console.log(`[WebRTC] [${ts}] Sending READY event...`);
    
    try {
      const result = await channel.send({
        type: "broadcast",
        event: "ready",
        payload: { 
          from: user.id,
          timestamp: ts,
          role: isInitiator ? "initiator" : "callee",
        },
      });
      console.log(`[WebRTC] [${Date.now()}] READY sent, result:`, result);
    } catch (error) {
      console.error("[WebRTC] ❌ Error sending ready:", error);
    }
  }, [user, isInitiator]);

  // Wait for remote ready event
  const waitForRemoteReady = useCallback((channel: ReturnType<typeof supabase.channel>): Promise<boolean> => {
    return new Promise((resolve) => {
      // If already received, resolve immediately
      if (remoteReadyRef.current) {
        console.log("[WebRTC] Remote already ready (from earlier)");
        resolve(true);
        return;
      }

      const handleReady = ({ payload }: { payload: { from: string; timestamp?: number; role?: string } }) => {
        if (payload.from !== user?.id) {
          console.log(`[WebRTC] [${Date.now()}] ✅ Received READY from remote (role: ${payload.role}, sent at: ${payload.timestamp})`);
          remoteReadyRef.current = true;
          if (readyTimeoutRef.current) {
            clearTimeout(readyTimeoutRef.current);
            readyTimeoutRef.current = null;
          }
          resolve(true);
        }
      };

      channel.on("broadcast", { event: "ready" }, handleReady);

      // Set timeout for waiting
      readyTimeoutRef.current = setTimeout(() => {
        console.warn(`[WebRTC] [${Date.now()}] ⚠️ Timeout waiting for remote READY after ${READY_TIMEOUT_MS}ms`);
        resolve(false);
      }, READY_TIMEOUT_MS);
    });
  }, [user]);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log(`[WebRTC] [${Date.now()}] Cleaning up resources...`);
    
    // Clear timeouts
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
    
    // Destroy peer
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    // Unsubscribe channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    // Reset refs
    peerReadyRef.current = false;
    remoteReadyRef.current = false;
    pendingSignalsRef.current = [];
    signalListenerAttachedRef.current = false;
    isStartingRef.current = false;
  }, []);

  // Retry the connection
  const retryConnection = useCallback(async () => {
    if (retryCountRef.current >= MAX_RETRIES) {
      console.error(`[WebRTC] [${Date.now()}] ❌ Max retries (${MAX_RETRIES}) reached, giving up`);
      setConnectionStatus("failed");
      onConnectionFailed?.();
      return;
    }
    
    retryCountRef.current++;
    console.log(`[WebRTC] [${Date.now()}] 🔄 Retry attempt ${retryCountRef.current}/${MAX_RETRIES}...`);
    
    // Partial cleanup - keep the stream
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    peerReadyRef.current = false;
    remoteReadyRef.current = false;
    pendingSignalsRef.current = [];
    signalListenerAttachedRef.current = false;
    isStartingRef.current = false;
    
    // Delay before retry
    await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    
    // Re-start
    startCallInternal();
  }, [onConnectionFailed]);

  // Internal start call logic
  const startCallInternal = useCallback(async () => {
    if (isStartingRef.current) {
      console.log("[WebRTC] startCall already in progress, skipping");
      return;
    }
    isStartingRef.current = true;
    
    const startTs = Date.now();
    console.log(`[WebRTC] [${startTs}] ========== START CALL ==========`);
    console.log(`[WebRTC] callId: ${callId}, role: ${isInitiator ? "INITIATOR" : "CALLEE"}, userId: ${user?.id}, retry: ${retryCountRef.current}`);

    if (!callId) {
      console.error("[WebRTC] Cannot start call: no callId");
      isStartingRef.current = false;
      return;
    }
    
    if (!user) {
      console.error("[WebRTC] Cannot start call: no user");
      isStartingRef.current = false;
      return;
    }

    // STEP 1: Subscribe to signaling channel FIRST (before anything else!)
    const channel = await setupSignaling();
    if (!channel) {
      console.error("[WebRTC] Cannot start call: signaling channel not ready");
      setConnectionStatus("failed");
      onConnectionFailed?.();
      isStartingRef.current = false;
      return;
    }

    // STEP 2: Set up ready event listener
    const remoteReadyPromise = waitForRemoteReady(channel);
    setConnectionStatus("waiting_ready");

    // STEP 3: Send our READY event IMMEDIATELY after subscription
    // This tells the other side we're listening
    await sendReady(channel);

    // STEP 4: Get local stream (this might take time for permission dialog)
    const stream = localStreamRef.current || await getLocalStream();
    if (!stream) {
      console.error("[WebRTC] Failed to get local stream");
      setConnectionStatus("failed");
      onConnectionFailed?.();
      isStartingRef.current = false;
      return;
    }

    // STEP 5: Different behavior for initiator vs callee
    if (isInitiator) {
      // INITIATOR: Wait for callee's READY before creating peer (generating offer)
      console.log("[WebRTC] Initiator waiting for callee READY...");
      const remoteReady = await remoteReadyPromise;
      
      if (!remoteReady) {
        console.warn("[WebRTC] ⚠️ Callee not ready, proceeding anyway (they might be slow)");
        // Continue anyway - callee might still connect if they're just slow
      }
      
      console.log(`[WebRTC] [${Date.now()}] Initiator creating peer...`);
      setConnectionStatus("exchanging_signals");
      await createPeer(stream, channel);
    } else {
      // CALLEE: Create peer immediately (to be ready to receive offer)
      // We already subscribed and sent ready, so we're safe
      console.log(`[WebRTC] [${Date.now()}] Callee creating peer immediately...`);
      setConnectionStatus("exchanging_signals");
      await createPeer(stream, channel);
      
      // Also track when initiator is ready (for logging)
      remoteReadyPromise.then((ready) => {
        if (ready) console.log("[WebRTC] Initiator confirmed ready");
      });
    }
    
    // STEP 6: Set connection timeout
    connectionTimeoutRef.current = setTimeout(() => {
      if (!isConnectedRef.current) {
        console.warn(`[WebRTC] [${Date.now()}] ⚠️ Connection timeout after ${CONNECTION_TIMEOUT_MS}ms`);
        retryConnection();
      }
    }, CONNECTION_TIMEOUT_MS);
    
    console.log(`[WebRTC] [${Date.now()}] startCall setup complete (took ${Date.now() - startTs}ms)`);
  }, [callId, isInitiator, user, getLocalStream, createPeer, setupSignaling, sendReady, waitForRemoteReady, onConnectionFailed, retryConnection]);

  // Public start call method
  const startCall = useCallback(() => {
    startCallInternal();
  }, [startCallInternal]);

  // Pre-warm media (call this early, e.g., when incoming call arrives)
  const preWarmMedia = useCallback(async () => {
    if (localStreamRef.current) {
      console.log("[WebRTC] Media already warmed up");
      return localStreamRef.current;
    }
    console.log("[WebRTC] Pre-warming media...");
    return await getLocalStream();
  }, [getLocalStream]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  }, [localStream, isMuted]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  }, [localStream, isVideoOff]);

  // Switch camera (front/back)
  const switchCamera = useCallback(async () => {
    if (!localStream || !peerRef.current) return;

    const currentTrack = localStream.getVideoTracks()[0];
    if (!currentTrack) return;

    const currentFacing =
      currentTrack.getSettings().facingMode === "user" ? "environment" : "user";

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentFacing },
        audio: false,
      });

      const newTrack = newStream.getVideoTracks()[0];
      
      // Replace track in peer connection
      const sender = (peerRef.current as any)._pc
        ?.getSenders()
        .find((s: RTCRtpSender) => s.track?.kind === "video");

      if (sender) {
        await sender.replaceTrack(newTrack);
      }

      // Replace track in local stream
      localStream.removeTrack(currentTrack);
      localStream.addTrack(newTrack);
      currentTrack.stop();
    } catch (error) {
      console.error("[WebRTC] Error switching camera:", error);
    }
  }, [localStream]);

  // End call and cleanup
  const endCall = useCallback(() => {
    console.log(`[WebRTC] [${Date.now()}] Ending call...`);
    
    // Stop all local tracks
    localStream?.getTracks().forEach((track) => {
      track.stop();
      console.log("[WebRTC] Stopped track:", track.kind);
    });
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    cleanup();
    retryCountRef.current = 0;

    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    setConnectionStatus("idle");
  }, [localStream, cleanup]);

  // Manual retry (exposed to UI)
  const manualRetry = useCallback(() => {
    console.log("[WebRTC] Manual retry requested");
    retryCountRef.current = 0; // Reset retry counter for manual retry
    cleanup();
    setTimeout(() => startCallInternal(), 500);
  }, [cleanup, startCallInternal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return {
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isVideoOff,
    connectionStatus,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
    preWarmMedia,
    manualRetry,
  };
}
