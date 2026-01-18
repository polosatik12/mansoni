import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { HomePage } from "@/pages/HomePage";
import { SearchPage } from "@/pages/SearchPage";
import { ModulesPage } from "@/pages/ModulesPage";
import { ChatsPage } from "@/pages/ChatsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { UserProfilePage } from "@/pages/UserProfilePage";
import { ReelsPage } from "@/pages/ReelsPage";
import { RealEstatePage } from "@/pages/RealEstatePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/modules" element={<ModulesPage />} />
            <Route path="/chats" element={<ChatsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/user/:username" element={<UserProfilePage />} />
            <Route path="/realestate" element={<RealEstatePage />} />
          </Route>
          <Route path="/reels" element={<ReelsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
