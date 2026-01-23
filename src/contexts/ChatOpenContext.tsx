import { createContext, useContext, useState, ReactNode } from "react";

interface ChatOpenContextType {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

const ChatOpenContext = createContext<ChatOpenContextType>({
  isChatOpen: false,
  setIsChatOpen: () => {},
});

export function ChatOpenProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <ChatOpenContext.Provider value={{ isChatOpen, setIsChatOpen }}>
      {children}
    </ChatOpenContext.Provider>
  );
}

export function useChatOpen() {
  return useContext(ChatOpenContext);
}
