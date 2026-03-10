import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import TopBar from "@/components/layout/TopBar";
import BackgroundMesh from "@/components/layout/BackgroundMesh";
import CommandPalette from "@/components/layout/CommandPalette";
import Dashboard from "@/pages/Dashboard";
import Agents from "@/pages/Agents";
import Workflows from "@/pages/Workflows";
import Files from "@/pages/Files";
import Settings from "@/pages/Settings";
import AgentChat from "@/pages/AgentChat";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { chatService } from "@/services/chat";

const queryClient = new QueryClient();

function AppRoutes() {
  const location = useLocation();
  // Use a stable key for agent chat routes so switching agents updates in-place
  // instead of unmount/remount (which causes "not connected" errors).
  const routeKey = location.pathname.startsWith('/agents/') && location.pathname.endsWith('/chat')
    ? '/agents/chat'
    : location.pathname;
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={routeKey}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/agents/:agentId/chat" element={<AgentChat />} />
        <Route path="/workflows" element={<Workflows />} />
        <Route path="/files" element={<Files />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function TokenBinder() {
  const { getToken } = useAuth();
  useEffect(() => {
    api.setTokenProvider(getToken);
    chatService.setTokenProvider(getToken);
  }, [getToken]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TokenBinder />
          <div className="min-h-screen relative">
            <BackgroundMesh />
            <TopBar />
            <CommandPalette />
            <main className="relative z-10">
              <AppRoutes />
            </main>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
