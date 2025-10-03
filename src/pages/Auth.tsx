import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, MessageSquare, User, Mail, Lock, Sparkles, Eye, EyeOff, Send } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const newPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignInForm = z.infer<typeof signInSchema>;
type SignUpForm = z.infer<typeof signUpSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
type NewPasswordForm = z.infer<typeof newPasswordSchema>;
type AuthForm = SignInForm | SignUpForm;

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [isSettingNewPassword, setIsSettingNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Use a single form with conditional schema
  const form = useForm<AuthForm>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: {
      email: '',
      password: '',
      ...(isSignUp && { displayName: '' }),
    },
  });

  // Separate form for password reset
  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // Separate form for setting new password
  const newPasswordForm = useForm<NewPasswordForm>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Check if this is a password reset link
    const urlParams = new URLSearchParams(location.search);
    const isReset = urlParams.get('reset') === 'true';
    
    if (isReset) {
      setIsSettingNewPassword(true);
      setIsResetPassword(false);
      setIsSignUp(false);
    }
  }, [location.search]);

  useEffect(() => {
    // If user is already authenticated, redirect to intended destination or feed
    if (user && !authLoading) {
      const from = (location.state as any)?.from?.pathname || '/feed';
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  // Show loading state if checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated, don't show auth form
  if (user) {
    return null;
  }

  const onSignIn = async (data: SignInForm) => {
    setLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (!error) {
        // Redirect will be handled by useEffect
        const from = (location.state as any)?.from?.pathname || '/feed';
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async (data: SignUpForm) => {
    setLoading(true);
    try {
      const { error } = await signUp(data.email, data.password, data.displayName);
      if (!error) {
        // Show success message and switch to sign in
        setIsSignUp(false);
      }
    } catch (error) {
      console.error('Sign up failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (data: ResetPasswordForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Check your email',
          description: 'We sent you a password reset link. Please check your email.',
        });
        setIsResetPassword(false);
      }
    } catch (error) {
      console.error('Password reset failed:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while sending reset email.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSetNewPassword = async (data: NewPasswordForm) => {
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
          title: 'Password updated',
          description: 'Your password has been successfully updated.',
        });
        // Clear URL params and return to sign in
        navigate('/auth', { replace: true });
        setIsSettingNewPassword(false);
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

  const handleLogin = async (data: SignInForm) => {
    setLoading(true);
    try {
      await onSignIn(data);
      setTimeout(() => navigate('/'), 1000); // Redirect after successful login with a slight delay
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsResetPassword(false);
    setIsSettingNewPassword(false);
    // Reset form when switching modes
    form.reset({
      email: '',
      password: '',
      ...(!isSignUp && { displayName: '' }),
    });
  };

  const handleShowResetPassword = () => {
    setIsResetPassword(true);
    setIsSignUp(false);
    setIsSettingNewPassword(false);
    // Pre-fill email if available
    const currentEmail = form.getValues('email');
    if (currentEmail) {
      resetForm.setValue('email', currentEmail);
    }
  };

  const handleBackToSignIn = () => {
    setIsResetPassword(false);
    setIsSignUp(false);
    setIsSettingNewPassword(false);
    // Clear URL params if returning from password reset
    if (location.search.includes('reset=true')) {
      navigate('/auth', { replace: true });
    }
  };

  const onSubmit = async (data: AuthForm) => {
    if (isSignUp) {
      await onSignUp(data as SignUpForm);
    } else {
      await onSignIn(data as SignInForm);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-indigo-500/20 dark:from-blue-600/10 dark:to-indigo-700/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 dark:from-purple-600/10 dark:to-pink-700/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-violet-400/15 to-purple-500/15 dark:from-violet-600/8 dark:to-purple-700/8 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full py-6 px-8 flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => navigate('/')} 
          className="flex items-center space-x-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
          E-consult
          </span>
        </div>
        
        <ThemeToggle />
      </header>

      {/* Main Auth Container */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-8 min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-md">
          <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
            <CardHeader className="text-center space-y-6 pb-8">
              {/* Mode Toggle Tabs - Hide during password reset or new password setting */}
              {!isResetPassword && !isSettingNewPassword && (
                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 mb-4">
                  <button
                    onClick={() => setIsSignUp(false)}
                    className={`flex-1 py-3 px-4 rounded-md text-sm font-semibold transition-all duration-300 ${
                      !isSignUp 
                        ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-md' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setIsSignUp(true)}
                    className={`flex-1 py-3 px-4 rounded-md text-sm font-semibold transition-all duration-300 ${
                      isSignUp 
                        ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-md' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Icon and Title */}
              <div className="flex flex-col items-center space-y-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                  isSettingNewPassword
                    ? 'bg-gradient-to-br from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700'
                    : isResetPassword
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700'
                      : isSignUp 
                        ? 'bg-gradient-to-br from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700' 
                        : 'bg-gradient-to-br from-indigo-500 to-blue-600 dark:from-indigo-600 dark:to-blue-700'
                }`}>
                  {isSettingNewPassword ? (
                    <Lock className="w-8 h-8 text-white" />
                  ) : isResetPassword ? (
                    <Mail className="w-8 h-8 text-white" />
                  ) : isSignUp ? (
                    <Sparkles className="w-8 h-8 text-white" />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {isSettingNewPassword ? 'Set New Password' : isResetPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
                  </CardTitle>
                  <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                    {isSettingNewPassword
                      ? 'Enter your new password below'
                      : isResetPassword
                        ? 'Enter your email to receive a password reset link'
                        : isSignUp
                          ? 'Join the professional consultation platform'
                          : 'Sign in to continue your journey'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {isSettingNewPassword ? (
                /* New Password Form */
                <Form {...newPasswordForm}>
                  <form onSubmit={newPasswordForm.handleSubmit(onSetNewPassword)} className="space-y-6">
                    <FormField
                      control={newPasswordForm.control}
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
                                className="pl-12 pr-12 h-11 bg-white/70 dark:bg-slate-700/70 border-slate-300 dark:border-slate-600 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-orange-500/20 dark:focus:ring-orange-400/20 transition-all"
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
                      control={newPasswordForm.control}
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
                                className="pl-12 pr-12 h-11 bg-white/70 dark:bg-slate-700/70 border-slate-300 dark:border-slate-600 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-orange-500/20 dark:focus:ring-orange-400/20 transition-all"
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
                      className="w-full h-11 text-base font-semibold text-white hover:scale-105 transition-all duration-300 shadow-lg bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-500 dark:to-red-500 hover:from-orange-700 hover:to-red-700" 
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span className="text-sm">Updating password...</span>
                        </div>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </form>
                </Form>
              ) : isResetPassword ? (
                /* Password Reset Form */
                <Form {...resetForm}>
                  <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-6">
                    <FormField
                      control={resetForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                              <Input 
                                placeholder="Enter your email"
                                className="pl-12 h-11 bg-white/70 dark:bg-slate-700/70 border-slate-300 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 transition-all"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full h-11 text-base font-semibold text-white hover:scale-105 transition-all duration-300 shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 hover:from-emerald-700 hover:to-teal-700" 
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span className="text-sm">Sending reset link...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Send className="w-4 h-4" />
                          <span>Send Reset Link</span>
                        </div>
                      )}
                    </Button>
                  </form>
                </Form>
              ) : (
                /* Sign In / Sign Up Form */
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(isSignUp ? onSignUp : onSignIn)} className="space-y-6">
                  {isSignUp && (
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Display Name
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                              <Input 
                                placeholder="Enter your display name"
                                className="pl-12 h-11 bg-white/70 dark:bg-slate-700/70 border-slate-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input 
                              placeholder="Enter your email"
                              className={`pl-12 h-11 bg-white/70 dark:bg-slate-700/70 border-slate-300 dark:border-slate-600 transition-all ${
                                isSignUp 
                                  ? 'focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 dark:focus:ring-purple-400/20' 
                                  : 'focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20'
                              }`}
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input 
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className={`pl-12 pr-12 h-11 bg-white/70 dark:bg-slate-700/70 border-slate-300 dark:border-slate-600 transition-all ${
                                isSignUp 
                                  ? 'focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 dark:focus:ring-purple-400/20' 
                                  : 'focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20'
                              }`}
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
                  
                  {/* Password Reset Link - Only show for Sign In */}
                  {!isSignUp && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleShowResetPassword}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className={`w-full h-11 text-base font-semibold text-white hover:scale-105 transition-all duration-300 shadow-lg ${
                      isSignUp 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 hover:from-purple-700 hover:to-pink-700' 
                        : 'bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 hover:from-indigo-700 hover:to-blue-700'
                    }`} 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="text-sm">{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                      </div>
                    ) : (
                      isSignUp ? 'Create Account' : 'Sign In'
                    )}
                  </Button>
                </form>
              </Form>
              )}
              
              {/* Footer section */}
              <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
                {isSettingNewPassword ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Having trouble?{' '}
                    <button 
                      onClick={handleBackToSignIn}
                      className="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                    >
                      Back to sign in
                    </button>
                  </p>
                ) : isResetPassword ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Remember your password?{' '}
                    <button 
                      onClick={handleBackToSignIn}
                      className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                    >
                      Back to sign in
                    </button>
                  </p>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}{' '}
                    <button 
                      onClick={handleToggleMode}
                      className={`font-semibold transition-colors ${
                        isSignUp 
                          ? 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300' 
                          : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300'
                      }`}
                    >
                      {isSignUp ? 'Sign in here' : 'Create account'}
                    </button>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;