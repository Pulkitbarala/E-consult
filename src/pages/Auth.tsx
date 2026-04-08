import { Suspense, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import SignIn from '@/pages/auth/SignIn';
import SignUp from '@/pages/auth/SignUp';
import ResetPassword from '@/pages/auth/ResetPassword';

const Auth = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      const from = (location.state as any)?.from?.pathname || '/feed';
      navigate(from, { replace: true });
    }
  }, [user, loading, location, navigate]);

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-[#f7f8ff] dark:bg-slate-900 overflow-hidden animate-page-smooth">
        <div className="purple-page-bg" />
        <div className="relative z-10 animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (user) return null;

  const params = new URLSearchParams(location.search);
  const mode = params.get('mode') || 'signin';

  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen flex items-center justify-center bg-[#f7f8ff] dark:bg-slate-900 overflow-hidden">
          <div className="purple-page-bg" />
          <div className="relative z-10 h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
        </div>
      }
    >
      {mode === 'signup' ? <SignUp /> : mode === 'reset' ? <ResetPassword /> : <SignIn />}
    </Suspense>
  );
};

export default Auth;