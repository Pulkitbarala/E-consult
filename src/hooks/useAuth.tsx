import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/services/apiClient';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
    captchaToken?: string | null
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    captchaToken?: string | null
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error('Error getting session:', error);
          }
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          console.log('Auth state changed:', event, session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          // Handle specific auth events
          if (event === 'SIGNED_OUT') {
            // Clear any cached data if needed
            localStorage.removeItem('supabase.auth.token');
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string,
    captchaToken?: string | null
  ): Promise<{ error: AuthError | null }> => {
    try {
      setLoading(true);
      const res = await api.signIn({ email, password, captchaToken });
      if (res.access_token && res.refresh_token) {
        await supabase.auth.setSession({ access_token: res.access_token, refresh_token: res.refresh_token });
        toast({ title: 'Welcome back!', description: 'You have successfully signed in.' });
        return { error: null };
      }
      toast({ title: 'Sign In Failed', description: 'No token returned', variant: 'destructive' });
      return { error: null };
    } catch (err: any) {
      toast({ title: 'Sign In Failed', description: err?.message || 'An unexpected error occurred', variant: 'destructive' });
      return { error: null };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    captchaToken?: string | null
  ): Promise<{ error: AuthError | null }> => {
    try {
      setLoading(true);
      const redirectUrl = (import.meta.env.VITE_AUTH_REDIRECT as string) || `${window.location.origin}/auth`;
      await api.signUp({ email, password, displayName, redirectUrl, captchaToken });
      toast({ title: 'Account created!', description: 'Please check your email to verify your account.' });
      return { error: null };
    } catch (err: any) {
      toast({ title: 'Sign Up Failed', description: err?.message || 'An unexpected error occurred', variant: 'destructive' });
      return { error: null };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Clear all possible auth-related storage
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'global' // This ensures complete logout
      });
      
      if (error) {
        console.error('Logout error:', error);
        // Even if there's an error, clear local state
      }
      
      // Force clear local auth state
      setUser(null);
      setSession(null);
      
      // Clear any cached data
      if (typeof window !== 'undefined') {
        // Clear all localStorage items that might contain auth data
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Force clear state even on error
      setUser(null);
      setSession(null);
      
      toast({
        title: "Sign Out Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}