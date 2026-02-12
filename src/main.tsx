import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";

// Expand Telegram Mini App to full height
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        isExpanded?: boolean;
        headerColor?: string;
        viewportHeight?: number;
        viewportStableHeight?: number;
        platform?: string;
      };
    };
  }
}

if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
  // Mark body as running inside Telegram Mini App
  document.documentElement.classList.add('tma');
  
  // Set CSS variable with actual TMA header offset
  const setTmaOffset = () => {
    const viewportHeight = window.Telegram?.WebApp?.viewportStableHeight || window.Telegram?.WebApp?.viewportHeight;
    if (viewportHeight) {
      const headerOffset = window.innerHeight - viewportHeight;
      if (headerOffset > 0) {
        document.documentElement.style.setProperty('--tma-header-offset', `${headerOffset}px`);
      }
    }
  };
  setTmaOffset();
  // Re-calculate on viewport changes
  window.addEventListener('resize', setTmaOffset);
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <App />
  </ThemeProvider>
);
