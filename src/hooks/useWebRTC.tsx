/**
 * useWebRTC hook - uses simple-peer for simplified WebRTC connections
 * Wrapper for backward compatibility
 */

import { useSimplePeerWebRTC, type WebRTCStatus } from "./useSimplePeerWebRTC";
import type { CallType } from "./useCalls";

interface UseWebRTCOptions {
  callId: string | null;
  callType: CallType;
  isInitiator: boolean;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onConnectionFailed?: () => void;
}

export type { WebRTCStatus };

export function useWebRTC(options: UseWebRTCOptions) {
  return useSimplePeerWebRTC(options);
}
