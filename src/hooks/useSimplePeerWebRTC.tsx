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
}

export function useSimplePeerWebRTC({
  callId,
  callType,
  isInitiator,
  onRemoteStream,
  onConnectionStateChange,
}: UseSimplePeerOptions) {
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const peerRef = useRef<Peer.Instance | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);

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
      return stream;
    } catch (error) {
      console.error("[SimplePeer] Error getting local stream:", error);
      return null;
    }
  }, [callType]);

  // Setup signaling channel and wait until it's SUBSCRIBED.
  // This prevents losing the very first offer/ICE candidates that simple-peer can emit immediately.
  const setupSignaling = useCallback(async () => {
    if (!callId || !user) return null;

    console.log(`[SimplePeer] Setting up signaling for call:${callId}, isInitiator: ${isInitiator}`);

    const channel = supabase.channel(`call:${callId}`, {
      config: {
        broadcast: { self: false },
      },
    });

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

  // Create peer connection
  const createPeer = useCallback(
    async (stream: MediaStream, channel: ReturnType<typeof supabase.channel> | null) => {
      const iceServers = await getIceServers();
      
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
        console.log("[SimplePeer] Signal generated, type:", signalData.type || "candidate");
        
        if (channel && user) {
          await channel.send({
            type: "broadcast",
            event: "signal",
            payload: {
              signalData,
              from: user.id,
            },
          });
          console.log("[SimplePeer] Signal sent to peer");
        }
      });

      // Receive signals from the other peer
      if (channel && user) {
        channel.on("broadcast", { event: "signal" }, ({ payload }) => {
          if (payload.from === user.id) return;
          console.log("[SimplePeer] Received signal from peer");
          try {
            peer.signal(payload.signalData);
          } catch (error) {
            console.error("[SimplePeer] Error processing signal:", error);
          }
        });
      }

      // Handle incoming stream
      peer.on("stream", (remoteMediaStream) => {
        console.log("[SimplePeer] Received remote stream with", remoteMediaStream.getTracks().length, "tracks");
        setRemoteStream(remoteMediaStream);
        onRemoteStream?.(remoteMediaStream);
      });

      // Handle connection
      peer.on("connect", () => {
        console.log("[SimplePeer] Connected!");
        setIsConnected(true);
        onConnectionStateChange?.("connected");
        
        // Clear connection timeout on success
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
      });

      // Handle errors
      peer.on("error", (error) => {
        console.error("[SimplePeer] Error:", error.message);
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
      return peer;
    },
    [isInitiator, user, onRemoteStream, onConnectionStateChange]
  );

  // Start the call
  const startCall = useCallback(async () => {
    console.log("[SimplePeer] Starting call...", { callId, isInitiator });

    // 1) Subscribe to signaling first to avoid dropping the first offer/candidates
    const channel = await setupSignaling();
    if (!channel) {
      console.error("[SimplePeer] Cannot start call: signaling channel not ready");
      return;
    }
    
    const stream = await getLocalStream();
    if (!stream) {
      console.error("[SimplePeer] Failed to get local stream");
      return;
    }

    await createPeer(stream, channel);
    
    // Set connection timeout (45 seconds)
    connectionTimeoutRef.current = setTimeout(() => {
      if (!isConnectedRef.current) {
        console.error("[SimplePeer] Connection timeout - could not establish connection within 45 seconds");
      }
    }, 45000);
  }, [callId, isInitiator, getLocalStream, createPeer, setupSignaling]);

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
    console.log("[SimplePeer] Ending call and cleaning up...");
    
    // Clear connection timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    // Stop all local tracks
    localStream?.getTracks().forEach((track) => {
      track.stop();
      console.log("[SimplePeer] Stopped track:", track.kind);
    });

    // Destroy peer connection
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    // Unsubscribe from signaling channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return {
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isVideoOff,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
  };
}
