import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, MessageSquare, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UpdatePasswordForm = z.infer<typeof updatePasswordSchema>;

const UpdatePassword = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const form = useForm<UpdatePasswordForm>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const checkPasswordResetSession = async () => {
      try {
        // Check if user has a valid session from password reset link
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setIsValidSession(false);
          setIsCheckingSession(false);
          return;
        }

        // Check if this is a password recovery session
        if (session && session.user) {
          // Verify this is specifically a password reset session by checking user metadata
          const isPasswordReset = session.user.app_metadata?.provider === 'email' && 
                                 session.user.user_metadata?.email_confirmed_at;
          
          if (isPasswordReset || searchParams.has('access_token')) {
            setIsValidSession(true);
          } else {
            setIsValidSession(false);
          }
        } else {
          setIsValidSession(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setIsValidSession(false);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkPasswordResetSession();
  }, [searchParams]);

  const onSubmit = async (data: UpdatePasswordForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Password updated successfully',
          description: 'Your password has been updated. You will be redirected to sign in.',
        });
        
        // Sign out the user after password update to force them to sign in with new password
        await supabase.auth.signOut();
        
        // Redirect to auth page after a short delay
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 2000);
      }
    } catch (error) {
      console.error('Password update failed:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while updating your password.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // If session is not valid, show access denied
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-red-400/20 to-orange-500/20 dark:from-red-600/10 dark:to-orange-700/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 dark:from-purple-600/10 dark:to-pink-700/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Header */}
        <header className="relative z-10 w-full py-6 px-8 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/auth')} 
            className="flex items-center space-x-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-orange-600 dark:from-red-600 dark:to-orange-700 rounded-xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">
              Ask Clarity
            </span>
          </div>
          
          <ThemeToggle />
        </header>

        {/* Access Denied Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-8 min-h-[calc(100vh-120px)]">
          <Card className="w-full max-w-md bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-red-200/50 dark:border-red-700/50 shadow-2xl">
            <CardHeader className="text-center space-y-6 pb-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 dark:from-red-600 dark:to-orange-700 flex items-center justify-center shadow-lg">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Access Denied
                  </CardTitle>
                  <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                    This page can only be accessed through a valid password reset link
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  If you need to reset your password, please go to the sign-in page and click "Forgot password?" to receive a new reset link.
                </p>
                
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full h-11 text-base font-semibold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-500 dark:to-orange-500 text-white hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  Go to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Valid session - show password update form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-green-400/20 to-emerald-500/20 dark:from-green-600/10 dark:to-emerald-700/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-cyan-500/20 dark:from-blue-600/10 dark:to-cyan-700/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full py-6 px-8 flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => navigate('/auth')} 
          className="flex items-center space-x-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Button>
        
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-xl flex items-center justify-center shadow-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
            Ask Clarity
          </span>
        </div>
        
        <ThemeToggle />
      </header>

      {/* Update Password Form */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-8 min-h-[calc(100vh-120px)]">
        <Card className="w-full max-w-md bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-green-200/50 dark:border-green-700/50 shadow-2xl">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 flex items-center justify-center shadow-lg">
                <Lock className="w-8 h-8 text-white" />
              </div>
              
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Set New Password
                </CardTitle>
                <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                  Create a secure password for your account
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        New Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your new password"
                            className="pl-12 pr-12 h-11 bg-white/70 dark:bg-slate-700/70 border-slate-300 dark:border-slate-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500/20 dark:focus:ring-green-400/20 transition-all"
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Confirm New Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <Input 
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your new password"
                            className="pl-12 pr-12 h-11 bg-white/70 dark:bg-slate-700/70 border-slate-300 dark:border-slate-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500/20 dark:focus:ring-green-400/20 transition-all"
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-semibold text-white hover:scale-105 transition-all duration-300 shadow-lg bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 hover:from-green-700 hover:to-emerald-700" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="text-sm">Updating password...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Update Password</span>
                    </div>
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                After updating your password, you'll be signed out and redirected to sign in with your new credentials.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdatePassword;