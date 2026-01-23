import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { HomePage } from "@/pages/HomePage";
import { SearchPage } from "@/pages/SearchPage";
import { ChatsPage } from "@/pages/ChatsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { UserProfilePage } from "@/pages/UserProfilePage";
import { ReelsPage } from "@/pages/ReelsPage";
import { RealEstatePage } from "@/pages/RealEstatePage";
import { PropertyDetailPage } from "@/pages/PropertyDetailPage";
import { InsurancePage } from "@/pages/InsurancePage";
import { AuthPage } from "@/pages/AuthPage";
import { ExploreFeedPage } from "@/pages/ExploreFeedPage";
import NotFound from "./pages/NotFound";
import { CommandPalette } from "@/components/CommandPalette";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CommandPalette />
          <Routes>
            {/* Public route - Auth page */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected routes - require authentication */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/explore/:postIndex" element={<ExploreFeedPage />} />
                <Route path="/chats" element={<ChatsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/user/:username" element={<UserProfilePage />} />
                <Route path="/realestate" element={<RealEstatePage />} />
                <Route path="/realestate/:id" element={<PropertyDetailPage />} />
                <Route path="/insurance" element={<InsurancePage />} />
                <Route path="/reels" element={<ReelsPage />} />
              </Route>
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
