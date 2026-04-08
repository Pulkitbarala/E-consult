import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import { useEffect, useState, lazy, Suspense } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AnalysisDashboard from './pages/AnalysisDashboard';

const queryClient = new QueryClient();

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Feed = lazy(() => import("./pages/Feed"));
const CreateConsultation = lazy(() => import("./pages/CreateConsultation"));
const ConsultationDetail = lazy(() => import("./pages/ConsultationDetail"));
const MyConsultations = lazy(() => import("./pages/MyConsultations"));
const CommentedConsultations = lazy(() => import("./pages/CommentedConsultations"));
const Profile = lazy(() => import("./pages/Profile"));
const UpdatePasswordValid = lazy(() => import("./pages/auth/UpdatePasswordValid"));
const UpdatePasswordInvalid = lazy(() => import("./pages/auth/UpdatePasswordInvalid"));
const NotFound = lazy(() => import("./pages/NotFound"));

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-[#f7f8ff] dark:bg-slate-900 overflow-hidden">
        <div className="purple-page-bg" />
        <div className="relative z-10 h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
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
    if (user && location.pathname === '/auth' && !location.search.includes('reset=true')) {
      navigate('/feed', { replace: true });
    }
  }, [user, location, navigate]);
  
  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-[#f7f8ff] dark:bg-slate-900 overflow-hidden">
        <div className="purple-page-bg" />
        <div className="relative z-10 h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
      </div>
    );
  }
  
  // If user is logged in and trying to access auth, redirect to feed
  // But allow access to update-password page even when authenticated
  if (
    user &&
    location.pathname !== '/update-password' &&
    !(location.pathname === '/auth' && location.search.includes('reset=true'))
  ) {
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
            <Suspense
              fallback={
                <div className="relative min-h-screen flex items-center justify-center bg-[#f7f8ff] dark:bg-slate-900 overflow-hidden">
                  <div className="purple-page-bg" />
                  <div className="relative z-10 h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
                <Route
                  path="/update-password"
                  element={<PublicRoute><UpdatePasswordGate /></PublicRoute>}
                />
                <Route path="/feed" element={<AuthGuard><Feed /></AuthGuard>} />
                <Route path="/create" element={<AuthGuard><CreateConsultation /></AuthGuard>} />
                <Route path="/consultation/:id" element={<AuthGuard><ConsultationDetail /></AuthGuard>} />
                <Route path="/my-consultations" element={<AuthGuard><MyConsultations /></AuthGuard>} />
                <Route path="/commented" element={<AuthGuard><CommentedConsultations /></AuthGuard>} />
                <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
                <Route path="/dashboard/:id" element={<AuthGuard><AnalysisDashboard /></AuthGuard>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

function UpdatePasswordGate() {
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const url = window.location.href;
        const hasCode = new URL(url).searchParams.has('code');
        if (hasCode) {
          try {
            const { supabase } = await import('@/integrations/supabase/client');
            await supabase.auth.exchangeCodeForSession(url);
          } catch (e) {
            console.error('exchangeCodeForSession failed:', e);
          }
        }

        const hash = window.location.hash || '';
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        const hasAccessToken = hash.includes('access_token') || searchParams.has('access_token');
        const isRecoveryType =
          hashParams.get('type') === 'recovery' || new URL(url).searchParams.get('type') === 'recovery';

        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error('Session error:', error);

        if (!active) return;
        setIsValidSession(Boolean(session) || hasAccessToken || isRecoveryType);
      } catch (err) {
        console.error('Error checking session:', err);
        if (!active) return;
        setIsValidSession(false);
      } finally {
        if (active) setIsCheckingSession(false);
      }
    };

    let subscription: { unsubscribe: () => void } | null = null;
    (async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setIsValidSession(true);
      });
      subscription = data.subscription;
    })();

    run();
    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [searchParams]);

  if (isCheckingSession) {
    return <UpdatePasswordInvalid checking />;
  }
  return isValidSession ? <UpdatePasswordValid /> : <UpdatePasswordInvalid />;
}

export default App;
