import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import { useEffect, lazy, Suspense } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";

const queryClient = new QueryClient();

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Feed = lazy(() => import("./pages/Feed"));
const CreateConsultation = lazy(() => import("./pages/CreateConsultation"));
const ConsultationDetail = lazy(() => import("./pages/ConsultationDetail"));
const MyConsultations = lazy(() => import("./pages/MyConsultations"));
const CommentedConsultations = lazy(() => import("./pages/CommentedConsultations"));
const Profile = lazy(() => import("./pages/Profile"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    // If user is not authenticated, send them to the public home page
    return <Navigate to="/" replace />;
  }
  
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If user is already logged in and tries to access auth page, redirect to feed
    // But allow access to update-password page even when authenticated
    if (user && location.pathname === '/auth') {
      navigate('/feed', { replace: true });
    }
  }, [user, location, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If user is logged in and trying to access auth, redirect to feed
  // But allow access to update-password page even when authenticated
  if (user && location.pathname !== '/update-password') {
    return <Navigate to="/feed" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
                <Route path="/update-password" element={<PublicRoute><UpdatePassword /></PublicRoute>} />
                <Route path="/feed" element={<AuthGuard><Feed /></AuthGuard>} />
                <Route path="/create" element={<AuthGuard><CreateConsultation /></AuthGuard>} />
                <Route path="/consultation/:id" element={<AuthGuard><ConsultationDetail /></AuthGuard>} />
                <Route path="/my-consultations" element={<AuthGuard><MyConsultations /></AuthGuard>} />
                <Route path="/commented" element={<AuthGuard><CommentedConsultations /></AuthGuard>} />
                <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
