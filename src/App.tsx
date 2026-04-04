import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import GuestNameDialog from "@/components/GuestNameDialog";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import ChatRoom from "./pages/ChatRoom";
import JoinRoom from "./pages/JoinRoom";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse-dot [animation-delay:0.2s]" />
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse-dot [animation-delay:0.4s]" />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const GuestNamePrompt = () => {
  const { needsName, setGuestName } = useAuth();
  return <GuestNameDialog open={needsName} onSubmit={setGuestName} />;
};

const AppRoutes = () => (
  <BrowserRouter>
    <GuestNamePrompt />
    <Routes>
      <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/chat/:roomId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
      <Route path="/join/:code" element={<JoinRoom />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
