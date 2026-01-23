import { createContext, useContext, ReactNode } from "react";
import { useCalls as useCallsHook, Call, CallType } from "@/hooks/useCalls";

interface CallsContextType {
  activeCall: Call | null;
  incomingCall: Call | null;
  startCall: (conversationId: string, calleeId: string, callType: CallType) => Promise<Call | null>;
  acceptCall: (callId: string) => Promise<void>;
  declineCall: (callId: string) => Promise<void>;
  endCall: (callId: string) => Promise<void>;
}

const CallsContext = createContext<CallsContextType | null>(null);

export function CallsProvider({ children }: { children: ReactNode }) {
  const callsHook = useCallsHook();
  return (
    <CallsContext.Provider value={callsHook}>
      {children}
    </CallsContext.Provider>
  );
}

export function useCallsContext() {
  const context = useContext(CallsContext);
  if (!context) {
    throw new Error("useCallsContext must be used within CallsProvider");
  }
  return context;
}

// Re-export types for convenience
export type { Call, CallType };
