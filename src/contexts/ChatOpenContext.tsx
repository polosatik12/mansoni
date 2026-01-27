import { createContext, useContext, useState, ReactNode } from "react";

interface ChatOpenContextType {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isStoryOpen: boolean;
  setIsStoryOpen: (open: boolean) => void;
  // Combined check for hiding bottom nav
  shouldHideBottomNav: boolean;
}

const ChatOpenContext = createContext<ChatOpenContextType>({
  isChatOpen: false,
  setIsChatOpen: () => {},
  isStoryOpen: false,
  setIsStoryOpen: () => {},
  shouldHideBottomNav: false,
});

export function ChatOpenProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isStoryOpen, setIsStoryOpen] = useState(false);

  const shouldHideBottomNav = isChatOpen || isStoryOpen;

  return (
    <ChatOpenContext.Provider value={{ 
      isChatOpen, 
      setIsChatOpen, 
      isStoryOpen, 
      setIsStoryOpen,
      shouldHideBottomNav 
    }}>
      {children}
    </ChatOpenContext.Provider>
  );
}

export function useChatOpen() {
  return useContext(ChatOpenContext);
}
