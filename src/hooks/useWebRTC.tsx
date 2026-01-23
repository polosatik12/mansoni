import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { CallType } from "./useCalls";

// ICE servers with TURN for NAT traversal between different networks
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // Free TURN servers for development (metered.ca)
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

interface UseWebRTCOptions {
  callId: string | null;
  callType: CallType;
  isInitiator: boolean;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

export function useWebRTC({
  callId,
  callType,
  isInitiator,
  onRemoteStream,
  onConnectionStateChange,
}: UseWebRTCOptions) {
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const peerReadyRef = useRef(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get local media stream
  const getLocalStream = useCallback(async () => {
    try {
      console.log("[WebRTC] Requesting media access...");
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === "video" ? { facingMode: "user" } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("[WebRTC] Got local stream with tracks:", stream.getTracks().map(t => t.kind));
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("[WebRTC] Error getting local stream:", error);
      return null;
    }
  }, [callType]);

  // Initialize WebRTC connection
  const initializePeerConnection = useCallback(
    (stream: MediaStream) => {
      console.log("[WebRTC] Creating PeerConnection with TURN servers...");
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks
      stream.getTracks().forEach((track) => {
        console.log("[WebRTC] Adding local track:", track.kind);
        pc.addTrack(track, stream);
      });

      // Handle incoming tracks
      pc.ontrack = (event) => {
        console.log("[WebRTC] Received remote track:", event.track.kind);
        const [remote] = event.streams;
        setRemoteStream(remote);
        onRemoteStream?.(remote);
      };

      // Handle ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate && channelRef.current) {
          const candidateType = event.candidate.candidate.includes("relay") 
            ? "TURN (relay)" 
            : event.candidate.candidate.includes("srflx") 
              ? "STUN (srflx)" 
              : "host";
          console.log(`[WebRTC] ICE candidate (${candidateType}):`, event.candidate.candidate.substring(0, 50) + "...");
          
          await channelRef.current.send({
            type: "broadcast",
            event: "ice",
            payload: {
              candidate: event.candidate.toJSON(),
              from: user?.id,
            },
          });
        }
      };

      // Connection state changes
      pc.onconnectionstatechange = () => {
        console.log("[WebRTC] Connection state:", pc.connectionState);
        
        if (pc.connectionState === "connected") {
          setIsConnected(true);
          // Clear connection timeout on success
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
        } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setIsConnected(false);
        }
        
        onConnectionStateChange?.(pc.connectionState);
      };

      // ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log("[WebRTC] ICE connection state:", pc.iceConnectionState);
      };

      // ICE gathering state changes
      pc.onicegatheringstatechange = () => {
        console.log("[WebRTC] ICE gathering state:", pc.iceGatheringState);
      };

      // Signaling state changes
      pc.onsignalingstatechange = () => {
        console.log("[WebRTC] Signaling state:", pc.signalingState);
      };

      peerConnectionRef.current = pc;
      return pc;
    },
    [user, onRemoteStream, onConnectionStateChange]
  );

  // Add pending ICE candidates
  const addPendingCandidates = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) return;

    console.log(`[WebRTC] Adding ${pendingCandidatesRef.current.length} pending ICE candidates`);
    for (const candidate of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.error("[WebRTC] Error adding pending ICE candidate:", error);
      }
    }
    pendingCandidatesRef.current = [];
  }, []);

  // Send SDP offer (called when peer is ready)
  const sendOffer = useCallback(async (pc: RTCPeerConnection, channel: ReturnType<typeof supabase.channel>) => {
    if (!user) return;
    
    console.log("[WebRTC] Creating and sending SDP offer...");
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("[WebRTC] Local description set, sending offer...");

      await channel.send({
        type: "broadcast",
        event: "sdp",
        payload: {
          type: "offer",
          sdp: pc.localDescription,
          from: user.id,
        },
      });
      console.log("[WebRTC] Offer sent successfully");
    } catch (error) {
      console.error("[WebRTC] Error creating/sending offer:", error);
    }
  }, [user]);

  // Setup signaling channel
  const setupSignaling = useCallback(
    async (pc: RTCPeerConnection) => {
      if (!callId || !user) return;

      console.log(`[WebRTC] Setting up signaling channel for call:${callId}, isInitiator: ${isInitiator}`);
      const channel = supabase.channel(`call:${callId}`);

      channel
        // Handle "ready" signal from peer
        .on("broadcast", { event: "ready" }, async ({ payload }) => {
          if (payload.from === user.id) return;
          
          console.log("[WebRTC] Peer is ready!");
          peerReadyRef.current = true;
          
          // If we're the initiator and peer is ready, send offer
          if (isInitiator) {
            await sendOffer(pc, channel);
          }
        })
        // Handle SDP offer/answer
        .on("broadcast", { event: "sdp" }, async ({ payload }) => {
          if (payload.from === user.id) return;

          console.log("[WebRTC] Received SDP:", payload.type);

          try {
            if (payload.type === "offer") {
              console.log("[WebRTC] Setting remote description (offer)...");
              await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
              await addPendingCandidates();
              
              console.log("[WebRTC] Creating answer...");
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              console.log("[WebRTC] Sending answer...");

              await channel.send({
                type: "broadcast",
                event: "sdp",
                payload: {
                  type: "answer",
                  sdp: pc.localDescription,
                  from: user.id,
                },
              });
              console.log("[WebRTC] Answer sent successfully");
            } else if (payload.type === "answer") {
              console.log("[WebRTC] Setting remote description (answer)...");
              await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
              await addPendingCandidates();
              console.log("[WebRTC] Answer processed successfully");
            }
          } catch (error) {
            console.error("[WebRTC] Error handling SDP:", error);
          }
        })
        // Handle ICE candidates
        .on("broadcast", { event: "ice" }, async ({ payload }) => {
          if (payload.from === user.id) return;

          const candidate = new RTCIceCandidate(payload.candidate);

          // If remote description is not set yet, queue the candidate
          if (!pc.remoteDescription) {
            console.log("[WebRTC] Queueing ICE candidate (no remote description yet)");
            pendingCandidatesRef.current.push(candidate);
            return;
          }

          try {
            await pc.addIceCandidate(candidate);
            console.log("[WebRTC] Added ICE candidate");
          } catch (error) {
            console.error("[WebRTC] Error adding ICE candidate:", error);
          }
        })
        .subscribe(async (status) => {
          console.log("[WebRTC] Channel status:", status);
          
          if (status === "SUBSCRIBED") {
            console.log("[WebRTC] Subscribed to channel, sending ready signal...");
            
            // Signal that we're ready
            await channel.send({
              type: "broadcast",
              event: "ready",
              payload: { from: user.id },
            });
            
            // If we're the initiator and peer was already ready, send offer
            // This handles the case where peer subscribed before us
            if (isInitiator && peerReadyRef.current) {
              await sendOffer(pc, channel);
            }
          }
        });

      channelRef.current = channel;
    },
    [callId, user, isInitiator, addPendingCandidates, sendOffer]
  );

  // Start the call
  const startCall = useCallback(async () => {
    console.log("[WebRTC] Starting call...", { callId, isInitiator });
    
    // Reset peer ready state
    peerReadyRef.current = false;
    
    const stream = await getLocalStream();
    if (!stream) {
      console.error("[WebRTC] Failed to get local stream");
      return;
    }

    const pc = initializePeerConnection(stream);
    await setupSignaling(pc);
    
    // Set connection timeout (30 seconds)
    connectionTimeoutRef.current = setTimeout(() => {
      if (!isConnected) {
        console.error("[WebRTC] Connection timeout - could not establish connection within 30 seconds");
        console.log("[WebRTC] Current ICE state:", pc.iceConnectionState);
        console.log("[WebRTC] Current connection state:", pc.connectionState);
      }
    }, 30000);
  }, [callId, isInitiator, getLocalStream, initializePeerConnection, setupSignaling, isConnected]);

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
    if (!localStream) return;

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
      const sender = peerConnectionRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === "video");

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
    console.log("[WebRTC] Ending call and cleaning up...");
    
    // Clear connection timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    // Stop all local tracks
    localStream?.getTracks().forEach((track) => {
      track.stop();
      console.log("[WebRTC] Stopped track:", track.kind);
    });

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Remove signaling channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Clear pending candidates
    pendingCandidatesRef.current = [];
    peerReadyRef.current = false;

    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
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
