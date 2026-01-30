import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { CallType } from "./useCalls";

// Default fallback ICE servers
const DEFAULT_ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: "all",
};

// Fetch Cloudflare TURN credentials from edge function
async function getCloudflareIceServers(): Promise<RTCConfiguration> {
  try {
    console.log("[WebRTC] Fetching Cloudflare TURN credentials...");
    const { data, error } = await supabase.functions.invoke("turn-credentials");
    
    if (error) {
      console.error("[WebRTC] Error fetching TURN credentials:", error);
      return DEFAULT_ICE_CONFIG;
    }

    console.log("[WebRTC] TURN response data:", JSON.stringify(data));

    // Cloudflare returns { iceServers: [...] } directly
    const iceServers = data?.iceServers;
    
    if (iceServers && Array.isArray(iceServers) && iceServers.length > 0) {
      console.log("[WebRTC] Got Cloudflare TURN servers:", iceServers.length);
      
      const config: RTCConfiguration = {
        iceServers: [
          // Add Google STUN as fallback first
          { urls: "stun:stun.l.google.com:19302" },
          ...iceServers,
        ],
        iceCandidatePoolSize: 10,
        iceTransportPolicy: "all",
      };
      
      console.log("[WebRTC] Using ICE config with", config.iceServers?.length, "servers");
      return config;
    }

    console.warn("[WebRTC] No ICE servers in response, using defaults");
    return DEFAULT_ICE_CONFIG;
  } catch (error) {
    console.error("[WebRTC] Failed to fetch TURN credentials:", error);
    return DEFAULT_ICE_CONFIG;
  }
}

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
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);
  const hasOfferSentRef = useRef(false);
  const iceRestartAttemptRef = useRef(0);

  // Track connection state with ref for timeout callback
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  // Get local media stream with Safari-optimized constraints
  const getLocalStream = useCallback(async () => {
    try {
      console.log("[WebRTC] Requesting media access...");
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
      console.log("[WebRTC] Got local stream with tracks:", stream.getTracks().map(t => `${t.kind}:${t.readyState}`));
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("[WebRTC] Error getting local stream:", error);
      return null;
    }
  }, [callType]);

  // Send SDP offer
  const sendOffer = useCallback(async (pc: RTCPeerConnection, channel: ReturnType<typeof supabase.channel>, isRestart = false) => {
    if (!user) return;
    
    // Prevent duplicate offers
    if (hasOfferSentRef.current && !isRestart) {
      console.log("[WebRTC] Offer already sent, skipping...");
      return;
    }
    
    hasOfferSentRef.current = true;
    console.log(`[WebRTC] Creating ${isRestart ? 'ICE restart ' : ''}SDP offer...`);
    
    try {
      const offerOptions: RTCOfferOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
        iceRestart: isRestart,
      };
      
      const offer = await pc.createOffer(offerOptions);
      await pc.setLocalDescription(offer);
      console.log("[WebRTC] Local description set, sending offer...");

      await channel.send({
        type: "broadcast",
        event: "sdp",
        payload: {
          type: "offer",
          sdp: pc.localDescription,
          from: user.id,
          isRestart,
        },
      });
      console.log("[WebRTC] Offer sent successfully");
    } catch (error) {
      console.error("[WebRTC] Error creating/sending offer:", error);
      hasOfferSentRef.current = false;
    }
  }, [user, callType]);

  // Initialize WebRTC connection
  const initializePeerConnection = useCallback(
    (stream: MediaStream, iceConfig: RTCConfiguration) => {
      console.log("[WebRTC] Creating PeerConnection with ICE servers...", iceConfig.iceServers?.length);
      const pc = new RTCPeerConnection(iceConfig);

      // Add local tracks
      stream.getTracks().forEach((track) => {
        console.log("[WebRTC] Adding local track:", track.kind);
        pc.addTrack(track, stream);
      });

      // Handle incoming tracks
      pc.ontrack = (event) => {
        console.log("[WebRTC] Received remote track:", event.track.kind, "streams:", event.streams.length);
        const [remote] = event.streams;
        if (remote) {
          setRemoteStream(remote);
          onRemoteStream?.(remote);
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate && channelRef.current) {
          const candidateType = event.candidate.candidate.includes("relay") 
            ? "TURN (relay)" 
            : event.candidate.candidate.includes("srflx") 
              ? "STUN (srflx)" 
              : "host";
          console.log(`[WebRTC] ICE candidate (${candidateType})`);
          
          await channelRef.current.send({
            type: "broadcast",
            event: "ice",
            payload: {
              candidate: event.candidate.toJSON(),
              from: user?.id,
            },
          });
        } else if (!event.candidate) {
          console.log("[WebRTC] ICE gathering complete");
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
        } else if (pc.connectionState === "failed") {
          setIsConnected(false);
          console.error("[WebRTC] Connection FAILED");
        } else if (pc.connectionState === "disconnected") {
          console.warn("[WebRTC] Connection disconnected, may recover...");
        }
        
        onConnectionStateChange?.(pc.connectionState);
      };

      // ICE connection state changes - critical for debugging
      pc.oniceconnectionstatechange = () => {
        console.log("[WebRTC] ICE connection state:", pc.iceConnectionState);
        
        // Handle ICE failure with restart attempt
        if (pc.iceConnectionState === "failed") {
          console.error("[WebRTC] ICE connection FAILED!");
          
          // Attempt ICE restart if we're the initiator and haven't tried too many times
          if (isInitiator && iceRestartAttemptRef.current < 2 && channelRef.current) {
            iceRestartAttemptRef.current++;
            console.log(`[WebRTC] Attempting ICE restart (attempt ${iceRestartAttemptRef.current})...`);
            pc.restartIce();
            sendOffer(pc, channelRef.current, true);
          }
        }
        
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          console.log("[WebRTC] ICE connected successfully!");
          iceRestartAttemptRef.current = 0;
        }
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
    [user, isInitiator, onRemoteStream, onConnectionStateChange, sendOffer]
  );

  // Add pending ICE candidates
  const addPendingCandidates = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) return;

    const count = pendingCandidatesRef.current.length;
    if (count > 0) {
      console.log(`[WebRTC] Adding ${count} pending ICE candidates`);
      for (const candidate of pendingCandidatesRef.current) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (error) {
          console.error("[WebRTC] Error adding pending ICE candidate:", error);
        }
      }
      pendingCandidatesRef.current = [];
    }
  }, []);

  // Setup signaling channel - simplified without ready mechanism
  const setupSignaling = useCallback(
    async (pc: RTCPeerConnection) => {
      if (!callId || !user) return;

      console.log(`[WebRTC] Setting up signaling channel for call:${callId}, isInitiator: ${isInitiator}`);
      const channel = supabase.channel(`call:${callId}`, {
        config: {
          broadcast: { self: false },
        },
      });

      channel
        // Handle SDP offer/answer
        .on("broadcast", { event: "sdp" }, async ({ payload }) => {
          if (payload.from === user.id) return;

          console.log("[WebRTC] Received SDP:", payload.type, payload.isRestart ? "(ICE restart)" : "");

          try {
            if (payload.type === "offer") {
              // If we already have a local description and this is not a restart, 
              // we might need to rollback first (glare handling)
              if (pc.signalingState !== "stable" && !payload.isRestart) {
                console.log("[WebRTC] Rolling back local description due to incoming offer...");
                await pc.setLocalDescription({ type: "rollback" });
              }
              
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
              if (pc.signalingState === "have-local-offer") {
                console.log("[WebRTC] Setting remote description (answer)...");
                await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                await addPendingCandidates();
                console.log("[WebRTC] Answer processed successfully");
              } else {
                console.warn("[WebRTC] Received answer in wrong signaling state:", pc.signalingState);
              }
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
            console.log("[WebRTC] Subscribed to signaling channel");
            
            // If we're the initiator, send offer after a short delay
            // This ensures the callee has time to subscribe
            if (isInitiator) {
              console.log("[WebRTC] Initiator will send offer in 1.5s...");
              setTimeout(async () => {
                if (peerConnectionRef.current && channelRef.current) {
                  await sendOffer(peerConnectionRef.current, channelRef.current);
                }
              }, 1500);
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
    
    // Reset state
    hasOfferSentRef.current = false;
    iceRestartAttemptRef.current = 0;
    pendingCandidatesRef.current = [];
    
    // Fetch Cloudflare TURN credentials
    const iceConfig = await getCloudflareIceServers();
    
    const stream = await getLocalStream();
    if (!stream) {
      console.error("[WebRTC] Failed to get local stream");
      return;
    }

    const pc = initializePeerConnection(stream, iceConfig);
    await setupSignaling(pc);
    
    // Set connection timeout (45 seconds for mobile networks)
    connectionTimeoutRef.current = setTimeout(() => {
      if (!isConnectedRef.current) {
        console.error("[WebRTC] Connection timeout - could not establish connection within 45 seconds");
        if (peerConnectionRef.current) {
          console.log("[WebRTC] Final ICE state:", peerConnectionRef.current.iceConnectionState);
          console.log("[WebRTC] Final connection state:", peerConnectionRef.current.connectionState);
          console.log("[WebRTC] Final signaling state:", peerConnectionRef.current.signalingState);
        }
      }
    }, 45000);
  }, [callId, isInitiator, getLocalStream, initializePeerConnection, setupSignaling]);

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

    // Clear state
    pendingCandidatesRef.current = [];
    hasOfferSentRef.current = false;
    iceRestartAttemptRef.current = 0;

    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      // Stop tracks if any
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      // Remove channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
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
