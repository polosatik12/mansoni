import { useState, useEffect, useRef, useCallback } from "react";
import Peer from "simple-peer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { CallType } from "./useCalls";

// Environment-based relay mode (set VITE_FORCE_RELAY=true to force TURN only)
const FORCE_RELAY = import.meta.env.VITE_FORCE_RELAY === "true";

// Debug mode - enable verbose logging
const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) {
    console.log(`[WebRTC] [${Date.now()}]`, ...args);
  }
}

function warn(...args: any[]) {
  console.warn(`[WebRTC] [${Date.now()}]`, ...args);
}

function error(...args: any[]) {
  console.error(`[WebRTC] [${Date.now()}]`, ...args);
}

// Fetch Cloudflare TURN credentials from edge function
async function getIceServers(): Promise<RTCIceServer[]> {
  const fallback: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  try {
    log("Fetching TURN credentials...");
    const { data, error: fetchError } = await supabase.functions.invoke("turn-credentials");
    
    if (fetchError) {
      error("Error fetching TURN:", fetchError);
      return fallback;
    }

    log("TURN response:", JSON.stringify(data, null, 2));

    if (data?.error) {
      warn("TURN service error:", data.error);
    }

    const iceServers = data?.iceServers;
    
    if (iceServers && Array.isArray(iceServers) && iceServers.length > 0) {
      log(`Got ${iceServers.length} ICE servers`);
      iceServers.forEach((s: any, i: number) => {
        const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
        log(`ICE[${i}]:`, urls.join(', '), s.username ? '(TURN)' : '(STUN)');
      });
      return iceServers;
    }

    warn("No valid ICE servers in response, using fallback");
    return fallback;
  } catch (e) {
    error("Failed to fetch TURN credentials:", e);
    return fallback;
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
  | "ice_checking"
  | "ice_connected"
  | "connected"
  | "failed";

// Constants for timing
const READY_TIMEOUT_MS = 15000; // Increased for iOS
const CONNECTION_TIMEOUT_MS = 35000;
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 2;
const PING_INTERVAL_MS = 20000;
const ICE_STALL_TIMEOUT_MS = 15000;
const READY_RESEND_INTERVAL_MS = 2000; // Resend ready every 2s

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
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const iceStallTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const readyResendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);
  const retryCountRef = useRef(0);
  const pendingSignalsRef = useRef<any[]>([]);
  const peerReadyRef = useRef(false);
  const remoteReadyRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceServersRef = useRef<RTCIceServer[] | null>(null);
  const signalListenerAttachedRef = useRef(false);
  // IMPORTANT: Realtime channel handlers must be attached BEFORE subscribe(),
  // otherwise iOS/Safari may never receive broadcast events.
  const readyResolverRef = useRef<((ok: boolean) => void) | null>(null);
  const isStartingRef = useRef(false);
  const iceRestartAttemptedRef = useRef(false);
  const readySentCountRef = useRef(0);

  // Track connection state with ref for timeout callback
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  // Get local media stream (can be called early)
  const getLocalStream = useCallback(async () => {
    // Check for pre-warmed stream from IncomingCallSheet
    const preWarmed = (window as any).__preWarmedStream;
    const preWarmedType = (window as any).__preWarmedStreamType;
    
    if (preWarmed && preWarmedType === callType) {
      log("Using pre-warmed stream from IncomingCallSheet");
      (window as any).__preWarmedStreamUsed = true;
      setLocalStream(preWarmed);
      localStreamRef.current = preWarmed;
      return preWarmed;
    }
    
    // Return cached stream if available
    if (localStreamRef.current) {
      log("Using cached local stream");
      return localStreamRef.current;
    }

    try {
      log(`Requesting media access (${callType})...`);
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
      log("Got local stream, tracks:", stream.getTracks().map(t => `${t.kind}:${t.readyState}`));
      
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (e) {
      error("Error getting local stream:", e);
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

  // Log ICE stats on failure
  const logIceStats = useCallback(async (peer: Peer.Instance) => {
    try {
      const pc = (peer as any)._pc as RTCPeerConnection | undefined;
      if (!pc) return;
      
      const stats = await pc.getStats();
      let candidatePairs: any[] = [];
      let localCandidates: any[] = [];
      let remoteCandidates: any[] = [];
      
      stats.forEach((report) => {
        if (report.type === 'candidate-pair') {
          candidatePairs.push({
            state: report.state,
            nominated: report.nominated,
            localCandidateId: report.localCandidateId,
            remoteCandidateId: report.remoteCandidateId,
          });
        }
        if (report.type === 'local-candidate') {
          localCandidates.push({
            type: report.candidateType,
            protocol: report.protocol,
            address: report.address,
            port: report.port,
          });
        }
        if (report.type === 'remote-candidate') {
          remoteCandidates.push({
            type: report.candidateType,
            protocol: report.protocol,
            address: report.address,
            port: report.port,
          });
        }
      });
      
      console.log("[WebRTC] ICE Stats on failure:");
      console.log("[WebRTC] Local candidates:", localCandidates);
      console.log("[WebRTC] Remote candidates:", remoteCandidates);
      console.log("[WebRTC] Candidate pairs:", candidatePairs);
    } catch (e) {
      console.warn("[WebRTC] Could not get ICE stats:", e);
    }
  }, []);

  // Attempt ICE restart
  const attemptIceRestart = useCallback((peer: Peer.Instance) => {
    if (iceRestartAttemptedRef.current) {
      console.log("[WebRTC] ICE restart already attempted, skipping");
      return;
    }
    
    try {
      const pc = (peer as any)._pc as RTCPeerConnection | undefined;
      if (pc && typeof pc.restartIce === 'function') {
        console.log("[WebRTC] 🔄 Attempting ICE restart...");
        iceRestartAttemptedRef.current = true;
        pc.restartIce();
      }
    } catch (e) {
      console.warn("[WebRTC] ICE restart failed:", e);
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
        const signalType = (signalData as any).type || "candidate";
        const signalSize = JSON.stringify(signalData).length;
        
        // Log ICE candidates in detail
        if (signalType === "candidate" && (signalData as any).candidate) {
          const c = (signalData as any).candidate;
          const candidateStr = typeof c === 'string' ? c : c?.candidate || '';
          console.log(`[WebRTC] [${Date.now()}] ICE candidate: ${candidateStr.substring(0, 80)}...`);
        } else {
          console.log(`[WebRTC] [${Date.now()}] Signal: ${signalType}, size: ${signalSize} bytes`);
        }
        
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
            if (result !== "ok") {
              console.warn(`[WebRTC] Signal send result: ${result}`);
            }
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

      // Handle data channel connection
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
        if (iceStallTimeoutRef.current) {
          clearTimeout(iceStallTimeoutRef.current);
          iceStallTimeoutRef.current = null;
        }
      });

      // Handle errors
      peer.on("error", (error) => {
        console.error(`[WebRTC] [${Date.now()}] ❌ Peer error:`, error.message);
        logIceStats(peer);
        setConnectionStatus("failed");
        onConnectionStateChange?.("failed");
      });

      // Handle close
      peer.on("close", () => {
        console.log(`[WebRTC] [${Date.now()}] Connection closed`);
        setIsConnected(false);
        onConnectionStateChange?.("closed" as RTCPeerConnectionState);
      });

      // Handle ICE connection state changes
      peer.on("iceStateChange", (iceConnectionState: string) => {
        console.log(`[WebRTC] [${Date.now()}] ICE state: ${iceConnectionState}`);
        
        if (iceConnectionState === "checking") {
          setConnectionStatus("ice_checking");
          
          // Start ICE stall timeout
          if (iceStallTimeoutRef.current) {
            clearTimeout(iceStallTimeoutRef.current);
          }
          iceStallTimeoutRef.current = setTimeout(() => {
            const currentPeer = peerRef.current;
            if (currentPeer && !isConnectedRef.current) {
              console.warn(`[WebRTC] ICE stuck in checking for ${ICE_STALL_TIMEOUT_MS}ms`);
              logIceStats(currentPeer);
              attemptIceRestart(currentPeer);
            }
          }, ICE_STALL_TIMEOUT_MS);
        }
        
        if (iceConnectionState === "connected" || iceConnectionState === "completed") {
          setConnectionStatus("ice_connected");
          if (iceStallTimeoutRef.current) {
            clearTimeout(iceStallTimeoutRef.current);
            iceStallTimeoutRef.current = null;
          }
        }
        
        if (iceConnectionState === "failed") {
          console.error("[WebRTC] ❌ ICE connection failed");
          logIceStats(peer);
          setConnectionStatus("failed");
        }
        
        if (iceConnectionState === "disconnected") {
          console.warn("[WebRTC] ⚠️ ICE disconnected, attempting restart...");
          attemptIceRestart(peer);
        }
      });

      peerRef.current = peer;
      peerReadyRef.current = true;
      
      // Flush any pending signals that arrived before peer was ready
      flushPendingSignals(peer);
      
      return peer;
    },
    [isInitiator, user, onRemoteStream, onConnectionStateChange, flushPendingSignals, logIceStats, attemptIceRestart]
  );

  // Setup signaling channel with signal listener and keepalive ping
  const setupSignaling = useCallback(async () => {
    if (!callId || !user) return null;

    log(`Setting up signaling channel call:${callId}, role: ${isInitiator ? "initiator" : "callee"}`);
    setConnectionStatus("subscribing");

    const channel = supabase.channel(`call:${callId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    // Attach handlers BEFORE subscribing
    if (!signalListenerAttachedRef.current) {
      channel.on("broadcast", { event: "signal" }, ({ payload }) => {
        if (payload.from === user.id) return;
        
        const signalType = payload.signalData?.type || "candidate";
        log(`📥 Received signal: ${signalType}`);
        
        if (peerRef.current && peerReadyRef.current) {
          try {
            peerRef.current.signal(payload.signalData);
          } catch (e) {
            error("Error processing signal:", e);
          }
        } else {
          log(`Buffering signal (${signalType}), buffer: ${pendingSignalsRef.current.length + 1}`);
          pendingSignalsRef.current.push(payload.signalData);
        }
      });
      
      // Handle keepalive ping
      channel.on("broadcast", { event: "ping" }, () => {
        // Silently acknowledge
      });

      // READY handshake listener (must be attached pre-subscribe)
      channel.on(
        "broadcast",
        { event: "ready" },
        ({ payload }: { payload: { from: string; timestamp?: number; role?: string; seq?: number } }) => {
          if (payload.from === user.id) return;
          if (remoteReadyRef.current) return;

          log(`✅ Received READY from ${payload.role} (seq=${payload.seq})`);
          remoteReadyRef.current = true;
          stopReadyResend();

          if (readyTimeoutRef.current) {
            clearTimeout(readyTimeoutRef.current);
            readyTimeoutRef.current = null;
          }

          if (readyResolverRef.current) {
            const resolve = readyResolverRef.current;
            readyResolverRef.current = null;
            resolve(true);
          }
        }
      );
      
      signalListenerAttachedRef.current = true;
    }

    // Subscribe with error handling
    const subscribed = await new Promise<boolean>((resolve) => {
      const subscribeTimeout = setTimeout(() => {
        error("❌ Channel subscribe timeout after 10s");
        resolve(false);
      }, 10000);
      
      channel.subscribe((status, err) => {
        log(`Channel status: ${status}`, err || "");
        
        if (status === "SUBSCRIBED") {
          clearTimeout(subscribeTimeout);
          resolve(true);
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          clearTimeout(subscribeTimeout);
          error(`❌ Channel error: ${status}`, err);
          resolve(false);
        }
      });
    });

    if (!subscribed) {
      error("Failed to subscribe to signaling channel");
      supabase.removeChannel(channel);
      return null;
    }

    log("✅ Signaling channel SUBSCRIBED");
    
    // Start keepalive ping
    pingIntervalRef.current = setInterval(() => {
      channel.send({
        type: "broadcast",
        event: "ping",
        payload: { from: user.id, ts: Date.now() },
      }).catch((e) => {
        warn("Ping failed:", e);
      });
    }, PING_INTERVAL_MS);
    
    channelRef.current = channel;
    return channel;
  }, [callId, user, isInitiator]);

  // Send ready event (with optional repeat for iOS reliability)
  const sendReady = useCallback(async (channel: ReturnType<typeof supabase.channel>, repeat = false) => {
    if (!user) return;
    
    readySentCountRef.current++;
    const count = readySentCountRef.current;
    const ts = Date.now();
    log(`📤 Sending READY #${count} (repeat=${repeat})...`);
    
    try {
      const result = await channel.send({
        type: "broadcast",
        event: "ready",
        payload: { 
          from: user.id,
          timestamp: ts,
          role: isInitiator ? "initiator" : "callee",
          seq: count,
        },
      });
      log(`READY #${count} sent, result:`, result);
    } catch (e) {
      error("Error sending ready:", e);
    }
  }, [user, isInitiator]);

  // Start periodic ready resend (for iOS Safari reliability)
  const startReadyResend = useCallback((channel: ReturnType<typeof supabase.channel>) => {
    if (readyResendIntervalRef.current) {
      clearInterval(readyResendIntervalRef.current);
    }
    
    readyResendIntervalRef.current = setInterval(() => {
      if (!remoteReadyRef.current && readySentCountRef.current < 8) {
        sendReady(channel, true);
      } else {
        // Stop resending if we got remote ready or sent enough
        if (readyResendIntervalRef.current) {
          clearInterval(readyResendIntervalRef.current);
          readyResendIntervalRef.current = null;
        }
      }
    }, READY_RESEND_INTERVAL_MS);
  }, [sendReady]);

  // Stop ready resend
  const stopReadyResend = useCallback(() => {
    if (readyResendIntervalRef.current) {
      clearInterval(readyResendIntervalRef.current);
      readyResendIntervalRef.current = null;
    }
  }, []);

  // Wait for remote ready event
  const waitForRemoteReady = useCallback((channel: ReturnType<typeof supabase.channel>): Promise<boolean> => {
    return new Promise((resolve) => {
      if (remoteReadyRef.current) {
        log("Remote already ready (from earlier)");
        stopReadyResend();
        resolve(true);
        return;
      }

      // Do NOT call channel.on() here (too late). We park the resolver and let
      // the pre-attached handler (in setupSignaling) resolve it.
      readyResolverRef.current = resolve;

      readyTimeoutRef.current = setTimeout(() => {
        warn(`⚠️ Timeout waiting for READY after ${READY_TIMEOUT_MS}ms (sent ${readySentCountRef.current} times)`);
        stopReadyResend();
        if (readyResolverRef.current === resolve) {
          readyResolverRef.current = null;
        }
        resolve(false);
      }, READY_TIMEOUT_MS);
    });
  }, [user, stopReadyResend]);

  // Cleanup function
  const cleanup = useCallback(() => {
    log("Cleaning up...");
    
    // Clear all timeouts and intervals
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (iceStallTimeoutRef.current) {
      clearTimeout(iceStallTimeoutRef.current);
      iceStallTimeoutRef.current = null;
    }
    if (readyResendIntervalRef.current) {
      clearInterval(readyResendIntervalRef.current);
      readyResendIntervalRef.current = null;
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
    readyResolverRef.current = null;
    pendingSignalsRef.current = [];
    signalListenerAttachedRef.current = false;
    isStartingRef.current = false;
    iceRestartAttemptedRef.current = false;
    readySentCountRef.current = 0;
  }, []);

  // Retry the connection
  const retryConnection = useCallback(async () => {
    if (retryCountRef.current >= MAX_RETRIES) {
      error(`❌ Max retries (${MAX_RETRIES}) reached`);
      setConnectionStatus("failed");
      onConnectionFailed?.();
      return;
    }
    
    retryCountRef.current++;
    log(`🔄 Retry ${retryCountRef.current}/${MAX_RETRIES}...`);
    
    // Partial cleanup - keep the stream
    stopReadyResend();
    if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (iceStallTimeoutRef.current) clearTimeout(iceStallTimeoutRef.current);
    
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
    iceRestartAttemptedRef.current = false;
    readySentCountRef.current = 0;
    
    await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    startCallInternal();
  }, [onConnectionFailed, stopReadyResend]);

  // Internal start call logic
  const startCallInternal = useCallback(async () => {
    if (isStartingRef.current) {
      console.log("[WebRTC] startCall already in progress");
      return;
    }
    isStartingRef.current = true;
    
    const startTs = Date.now();
    log("========== START CALL ==========");
    log(`callId: ${callId}, role: ${isInitiator ? "INITIATOR" : "CALLEE"}, retry: ${retryCountRef.current}`);

    if (!callId || !user) {
      error("Missing callId or user");
      isStartingRef.current = false;
      return;
    }

    // STEP 1: Subscribe to signaling first
    const channel = await setupSignaling();
    if (!channel) {
      error("Signaling channel failed");
      setConnectionStatus("failed");
      onConnectionFailed?.();
      isStartingRef.current = false;
      return;
    }

    // STEP 2: Set up ready listener
    const remoteReadyPromise = waitForRemoteReady(channel);
    setConnectionStatus("waiting_ready");

    // STEP 3: Send READY immediately + start periodic resend for iOS reliability
    await sendReady(channel);
    startReadyResend(channel);

    // STEP 4: Get local stream
    const stream = localStreamRef.current || await getLocalStream();
    if (!stream) {
      error("Failed to get local stream");
      setConnectionStatus("failed");
      onConnectionFailed?.();
      stopReadyResend();
      isStartingRef.current = false;
      return;
    }

    // STEP 5: Role-based peer creation
    if (isInitiator) {
      log("Initiator waiting for callee READY...");
      const remoteReady = await remoteReadyPromise;
      stopReadyResend();
      
      if (!remoteReady) {
        warn("⚠️ Callee not ready after timeout, proceeding anyway (might work if they join late)");
      }
      
      log("Creating peer as initiator...");
      setConnectionStatus("exchanging_signals");
      await createPeer(stream, channel);
    } else {
      // Callee creates peer immediately to receive offer
      log("Creating peer as callee...");
      setConnectionStatus("exchanging_signals");
      await createPeer(stream, channel);
      
      remoteReadyPromise.then((ready) => {
        stopReadyResend();
        if (ready) log("Initiator confirmed ready");
      });
    }
    
    // STEP 6: Connection timeout
    connectionTimeoutRef.current = setTimeout(() => {
      if (!isConnectedRef.current) {
        warn(`Connection timeout after ${CONNECTION_TIMEOUT_MS}ms`);
        stopReadyResend();
        if (peerRef.current) {
          logIceStats(peerRef.current);
        }
        retryConnection();
      }
    }, CONNECTION_TIMEOUT_MS);
    
    log(`Setup complete (took ${Date.now() - startTs}ms)`);
  }, [callId, isInitiator, user, getLocalStream, createPeer, setupSignaling, sendReady, startReadyResend, stopReadyResend, waitForRemoteReady, onConnectionFailed, retryConnection, logIceStats]);

  // Public start call method
  const startCall = useCallback(() => {
    startCallInternal();
  }, [startCallInternal]);

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

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (!localStream || !peerRef.current) return;

    const currentTrack = localStream.getVideoTracks()[0];
    if (!currentTrack) return;

    const currentFacing = currentTrack.getSettings().facingMode === "user" ? "environment" : "user";

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentFacing },
        audio: false,
      });

      const newTrack = newStream.getVideoTracks()[0];
      const sender = (peerRef.current as any)._pc
        ?.getSenders()
        .find((s: RTCRtpSender) => s.track?.kind === "video");

      if (sender) {
        await sender.replaceTrack(newTrack);
      }

      localStream.removeTrack(currentTrack);
      localStream.addTrack(newTrack);
      currentTrack.stop();
    } catch (error) {
      console.error("[WebRTC] Error switching camera:", error);
    }
  }, [localStream]);

  // End call
  const endCall = useCallback(() => {
    console.log(`[WebRTC] [${Date.now()}] Ending call...`);
    
    localStream?.getTracks().forEach((track) => {
      track.stop();
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
    retryCountRef.current = 0;
    iceServersRef.current = null; // Force refetch TURN credentials
    cleanup();
    setTimeout(() => startCallInternal(), 500);
  }, [cleanup, startCallInternal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (iceStallTimeoutRef.current) clearTimeout(iceStallTimeoutRef.current);
      if (peerRef.current) peerRef.current.destroy();
      if (channelRef.current) supabase.removeChannel(channelRef.current);
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
    manualRetry,
  };
}
