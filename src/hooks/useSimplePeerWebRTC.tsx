import { useState, useEffect, useRef, useCallback } from "react";
import Peer from "simple-peer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { CallType } from "./useCalls";

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
    console.log("[SimplePeer] Fetching TURN credentials...");
    const { data, error } = await supabase.functions.invoke("turn-credentials");
    
    if (error) {
      console.error("[SimplePeer] Error fetching TURN credentials:", error);
      return DEFAULT_ICE_CONFIG.iceServers!;
    }

    console.log("[SimplePeer] TURN response:", JSON.stringify(data, null, 2));

    const iceServers = data?.iceServers;
    
    if (iceServers && Array.isArray(iceServers) && iceServers.length > 0) {
      console.log("[SimplePeer] Got", iceServers.length, "ICE servers from Cloudflare");
      return [
        { urls: "stun:stun.l.google.com:19302" },
        ...iceServers,
      ];
    }

    console.warn("[SimplePeer] No ICE servers in response, using defaults");
    return DEFAULT_ICE_CONFIG.iceServers!;
  } catch (error) {
    console.error("[SimplePeer] Failed to fetch TURN credentials:", error);
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

// Constants for timing
const READY_TIMEOUT_MS = 8000;
const CONNECTION_TIMEOUT_MS = 20000;
const RETRY_DELAY_MS = 1000;

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
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "waiting_ready" | "connecting" | "connected" | "failed">("idle");

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

  // Track connection state with ref for timeout callback
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  // Get local media stream
  const getLocalStream = useCallback(async () => {
    try {
      console.log("[SimplePeer] Requesting media access...");
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
      console.log("[SimplePeer] Got local stream with tracks:", stream.getTracks().map(t => `${t.kind}:${t.readyState}`));
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error("[SimplePeer] Error getting local stream:", error);
      return null;
    }
  }, [callType]);

  // Apply any pending signals to the peer
  const flushPendingSignals = useCallback((peer: Peer.Instance) => {
    if (pendingSignalsRef.current.length > 0) {
      console.log(`[SimplePeer] Flushing ${pendingSignalsRef.current.length} pending signals`);
      pendingSignalsRef.current.forEach((signalData) => {
        try {
          peer.signal(signalData);
        } catch (error) {
          console.error("[SimplePeer] Error applying pending signal:", error);
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
      
      console.log("[SimplePeer] Creating peer, initiator:", isInitiator, "ICE servers:", iceServers.length);
      
      const peer = new Peer({
        initiator: isInitiator,
        trickle: true,
        stream: stream,
        config: {
          iceServers: iceServers,
        },
      });

      // Handle signals (SDP offers/answers and ICE candidates)
      peer.on("signal", async (signalData) => {
        const signalType = signalData.type || "candidate";
        const signalSize = JSON.stringify(signalData).length;
        console.log(`[SimplePeer] Signal generated, type: ${signalType}, size: ${signalSize} bytes`);
        
        if (channel && user) {
          try {
            const result = await channel.send({
              type: "broadcast",
              event: "signal",
              payload: {
                signalData,
                from: user.id,
              },
            });
            console.log(`[SimplePeer] Signal sent, result:`, result);
          } catch (error) {
            console.error("[SimplePeer] Error sending signal:", error);
          }
        }
      });

      // Handle incoming stream
      peer.on("stream", (remoteMediaStream) => {
        console.log("[SimplePeer] Received remote stream with", remoteMediaStream.getTracks().length, "tracks");
        setRemoteStream(remoteMediaStream);
        onRemoteStream?.(remoteMediaStream);
      });

      // Handle connection
      peer.on("connect", () => {
        console.log("[SimplePeer] ✓ Connected!");
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
        console.error("[SimplePeer] Error:", error.message);
        setConnectionStatus("failed");
        onConnectionStateChange?.("failed");
      });

      // Handle close
      peer.on("close", () => {
        console.log("[SimplePeer] Connection closed");
        setIsConnected(false);
        onConnectionStateChange?.("closed" as RTCPeerConnectionState);
      });

      // Handle ICE connection state for debugging
      peer.on("iceStateChange", (iceConnectionState: string) => {
        console.log("[SimplePeer] ICE state:", iceConnectionState);
      });

      peerRef.current = peer;
      peerReadyRef.current = true;
      
      // Flush any pending signals that arrived before peer was ready
      flushPendingSignals(peer);
      
      return peer;
    },
    [isInitiator, user, onRemoteStream, onConnectionStateChange, flushPendingSignals]
  );

  // Setup signaling channel with signal listener attached immediately
  const setupSignaling = useCallback(async () => {
    if (!callId || !user) return null;

    console.log(`[SimplePeer] Setting up signaling for call:${callId}, isInitiator: ${isInitiator}`);

    const channel = supabase.channel(`call:${callId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    // IMPORTANT: Attach signal listener BEFORE subscribing
    // This ensures we never miss any signals
    channel.on("broadcast", { event: "signal" }, ({ payload }) => {
      if (payload.from === user.id) return;
      
      const signalType = payload.signalData?.type || "candidate";
      console.log(`[SimplePeer] Received signal: ${signalType}`);
      
      // If peer exists, apply signal directly; otherwise buffer it
      if (peerRef.current && peerReadyRef.current) {
        try {
          peerRef.current.signal(payload.signalData);
        } catch (error) {
          console.error("[SimplePeer] Error processing signal:", error);
        }
      } else {
        console.log("[SimplePeer] Peer not ready, buffering signal");
        pendingSignalsRef.current.push(payload.signalData);
      }
    });

    // Subscribe and wait for SUBSCRIBED status
    const subscribed = await new Promise<boolean>((resolve) => {
      channel.subscribe((status) => {
        console.log("[SimplePeer] Channel status:", status);
        if (status === "SUBSCRIBED") resolve(true);
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") resolve(false);
      });
    });

    if (!subscribed) {
      console.error("[SimplePeer] Failed to subscribe signaling channel");
      supabase.removeChannel(channel);
      return null;
    }

    channelRef.current = channel;
    return channel;
  }, [callId, user, isInitiator]);

  // Send ready event
  const sendReady = useCallback(async (channel: ReturnType<typeof supabase.channel>) => {
    if (!user) return;
    
    console.log("[SimplePeer] Sending ready event");
    try {
      const result = await channel.send({
        type: "broadcast",
        event: "ready",
        payload: { from: user.id },
      });
      console.log("[SimplePeer] Ready event sent, result:", result);
    } catch (error) {
      console.error("[SimplePeer] Error sending ready:", error);
    }
  }, [user]);

  // Wait for remote ready event
  const waitForRemoteReady = useCallback((channel: ReturnType<typeof supabase.channel>): Promise<boolean> => {
    return new Promise((resolve) => {
      // If already received, resolve immediately
      if (remoteReadyRef.current) {
        console.log("[SimplePeer] Remote already ready");
        resolve(true);
        return;
      }

      const handleReady = ({ payload }: { payload: { from: string } }) => {
        if (payload.from !== user?.id) {
          console.log("[SimplePeer] ✓ Received ready from remote");
          remoteReadyRef.current = true;
          clearTimeout(readyTimeoutRef.current!);
          resolve(true);
        }
      };

      channel.on("broadcast", { event: "ready" }, handleReady);

      // Set timeout for waiting
      readyTimeoutRef.current = setTimeout(() => {
        console.warn("[SimplePeer] Timeout waiting for remote ready");
        resolve(false);
      }, READY_TIMEOUT_MS);
    });
  }, [user]);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log("[SimplePeer] Cleaning up...");
    
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
  }, []);

  // Start the call with handshake
  const startCall = useCallback(async () => {
    console.log("[SimplePeer] startCall() invoked", { callId, isInitiator, userId: user?.id, retry: retryCountRef.current });

    if (!callId) {
      console.error("[SimplePeer] Cannot start call: no callId");
      return;
    }
    
    if (!user) {
      console.error("[SimplePeer] Cannot start call: no user");
      return;
    }

    setConnectionStatus("waiting_ready");

    // 1) Subscribe to signaling first (with signal listener already attached)
    const channel = await setupSignaling();
    if (!channel) {
      console.error("[SimplePeer] Cannot start call: signaling channel not ready");
      setConnectionStatus("failed");
      onConnectionFailed?.();
      return;
    }

    // 2) Set up ready event listener before sending our ready
    const remoteReadyPromise = waitForRemoteReady(channel);

    // 3) Get local stream
    const stream = localStreamRef.current || await getLocalStream();
    if (!stream) {
      console.error("[SimplePeer] Failed to get local stream");
      setConnectionStatus("failed");
      onConnectionFailed?.();
      return;
    }

    // 4) Send our ready event
    await sendReady(channel);

    // 5) Behavior differs based on role
    if (isInitiator) {
      // Initiator waits for remote ready before creating peer
      console.log("[SimplePeer] Initiator waiting for remote ready...");
      const remoteReady = await remoteReadyPromise;
      
      if (!remoteReady) {
        console.warn("[SimplePeer] Remote not ready, but proceeding anyway (might work if they join late)");
      }
      
      setConnectionStatus("connecting");
      await createPeer(stream, channel);
    } else {
      // Callee creates peer immediately (to be ready to receive offer)
      setConnectionStatus("connecting");
      await createPeer(stream, channel);
      
      // Also wait for remote ready (mostly for logging)
      remoteReadyPromise.then((ready) => {
        if (ready) console.log("[SimplePeer] Initiator is ready");
      });
    }
    
    // 6) Set connection timeout with auto-retry
    connectionTimeoutRef.current = setTimeout(async () => {
      if (!isConnectedRef.current) {
        console.warn(`[SimplePeer] Connection timeout after ${CONNECTION_TIMEOUT_MS}ms`);
        
        // Try one retry
        if (retryCountRef.current < 1) {
          console.log("[SimplePeer] Attempting retry...");
          retryCountRef.current++;
          cleanup();
          
          // Small delay before retry
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          startCall();
        } else {
          console.error("[SimplePeer] Connection failed after retry");
          setConnectionStatus("failed");
          onConnectionFailed?.();
        }
      }
    }, CONNECTION_TIMEOUT_MS);
  }, [callId, isInitiator, user, getLocalStream, createPeer, setupSignaling, sendReady, waitForRemoteReady, cleanup, onConnectionFailed]);

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
      console.error("[SimplePeer] Error switching camera:", error);
    }
  }, [localStream]);

  // End call and cleanup
  const endCall = useCallback(() => {
    console.log("[SimplePeer] Ending call...");
    
    // Stop all local tracks
    localStream?.getTracks().forEach((track) => {
      track.stop();
      console.log("[SimplePeer] Stopped track:", track.kind);
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
  };
}
