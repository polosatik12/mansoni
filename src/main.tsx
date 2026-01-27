import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
// Required for IMG.LY CreativeEditor SDK UI (CE.SDK)
import "@cesdk/cesdk-js/assets/ui/stylesheets/cesdk.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <App />
  </ThemeProvider>
);
