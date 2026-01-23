import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import type { CallType } from "./useCalls";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
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

  // Get local media stream
  const getLocalStream = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === "video" ? { facingMode: "user" } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Error getting local stream:", error);
      return null;
    }
  }, [callType]);

  // Initialize WebRTC connection
  const initializePeerConnection = useCallback(
    (stream: MediaStream) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle incoming tracks
      pc.ontrack = (event) => {
        const [remote] = event.streams;
        setRemoteStream(remote);
        onRemoteStream?.(remote);
      };

      // Handle ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate && channelRef.current) {
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
        setIsConnected(pc.connectionState === "connected");
        onConnectionStateChange?.(pc.connectionState);
      };

      peerConnectionRef.current = pc;
      return pc;
    },
    [user, onRemoteStream, onConnectionStateChange]
  );

  // Setup signaling channel
  const setupSignaling = useCallback(
    async (pc: RTCPeerConnection) => {
      if (!callId || !user) return;

      const channel = supabase.channel(`call:${callId}`);

      channel
        .on("broadcast", { event: "sdp" }, async ({ payload }) => {
          if (payload.from === user.id) return;

          if (payload.type === "offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await channel.send({
              type: "broadcast",
              event: "sdp",
              payload: {
                type: "answer",
                sdp: pc.localDescription,
                from: user.id,
              },
            });
          } else if (payload.type === "answer") {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          }
        })
        .on("broadcast", { event: "ice" }, async ({ payload }) => {
          if (payload.from === user.id) return;

          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (error) {
            console.error("Error adding ICE candidate:", error);
          }
        })
        .subscribe();

      channelRef.current = channel;

      // If initiator, create and send offer
      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await channel.send({
          type: "broadcast",
          event: "sdp",
          payload: {
            type: "offer",
            sdp: pc.localDescription,
            from: user.id,
          },
        });
      }
    },
    [callId, user, isInitiator]
  );

  // Start the call
  const startCall = useCallback(async () => {
    const stream = await getLocalStream();
    if (!stream) return;

    const pc = initializePeerConnection(stream);
    await setupSignaling(pc);
  }, [getLocalStream, initializePeerConnection, setupSignaling]);

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
      console.error("Error switching camera:", error);
    }
  }, [localStream]);

  // End call and cleanup
  const endCall = useCallback(() => {
    // Stop all local tracks
    localStream?.getTracks().forEach((track) => track.stop());

    // Close peer connection
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    // Remove signaling channel
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
