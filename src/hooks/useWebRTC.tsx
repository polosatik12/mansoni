/**
 * useWebRTC hook - теперь использует simple-peer для упрощения WebRTC соединений
 * Обёртка для обратной совместимости
 */

import { useSimplePeerWebRTC } from "./useSimplePeerWebRTC";
import type { CallType } from "./useCalls";

interface UseWebRTCOptions {
  callId: string | null;
  callType: CallType;
  isInitiator: boolean;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onConnectionFailed?: () => void;
}

export function useWebRTC(options: UseWebRTCOptions) {
  // Просто проксируем на новый хук simple-peer
  return useSimplePeerWebRTC(options);
}
