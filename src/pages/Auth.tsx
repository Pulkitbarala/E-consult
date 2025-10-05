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
    // Always ensure we stay on the auth page when going back
    if (location.pathname !== '/auth') {
      navigate('/auth', { replace: true });
    }
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-blue-100/30 to-indigo-100/30 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-purple-100/30 to-pink-100/30 dark:from-purple-900/10 dark:to-pink-900/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full py-6 px-6 flex justify-between items-center">
        {!isResetPassword && (
          <Button
            variant="ghost"
            onClick={() => navigate('/')} 
            className="flex items-center space-x-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
        )}
        
        {/* Spacer to maintain layout when back button is hidden */}
        {isResetPassword && <div></div>}
        
        <ThemeToggle />
      </header>

      {/* Main Auth Container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 min-h-[calc(100vh-120px)]">
        {/* Centered E-consult Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            E-consult
          </span>
        </div>
        
        <div className="w-full max-w-md">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader className="text-center space-y-4 pb-6">
              {/* Mode Toggle Tabs - Hide during password reset or new password setting */}
              {!isResetPassword && !isSettingNewPassword && (
                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 mb-4">
                  <button
                    onClick={() => setIsSignUp(false)}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                      !isSignUp 
                        ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setIsSignUp(true)}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                      isSignUp 
                        ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Icon and Title */}
              <div className="flex flex-col items-center space-y-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                  isSettingNewPassword
                    ? 'bg-orange-100 dark:bg-orange-900/20'
                    : isResetPassword
                      ? 'bg-green-100 dark:bg-green-900/20'
                      : isSignUp 
                        ? 'bg-blue-100 dark:bg-blue-900/20' 
                        : 'bg-indigo-100 dark:bg-indigo-900/20'
                }`}>
                  {isSettingNewPassword ? (
                    <Lock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  ) : isResetPassword ? (
                    <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : isSignUp ? (
                    <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {isSettingNewPassword ? 'Set New Password' : isResetPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
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
            
            <CardContent className="space-y-6 p-6">
              {isSettingNewPassword ? (
                /* New Password Form */
                <Form {...newPasswordForm}>
                  <form onSubmit={newPasswordForm.handleSubmit(onSetNewPassword)} className="space-y-4">
                    <FormField
                      control={newPasswordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            New Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <Input 
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your new password"
                                className="pl-10 pr-10 h-9 text-sm border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                                {...field} 
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                              >
                                {showPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
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
                          <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            Confirm New Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <Input 
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your new password"
                                className="pl-10 pr-10 h-9 text-sm border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                                {...field} 
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
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
                      className="w-full h-9 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white transition-colors" 
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
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleBackToSignIn}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Go back</h3>
                  </div>
                  <Form {...resetForm}>
                    <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
                    <FormField
                      control={resetForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <Input 
                                placeholder="Enter your email"
                                className="pl-10 h-9 text-sm border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
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
                      className="w-full h-9 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white transition-colors" 
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
                </div>
              ) : (
                /* Sign In / Sign Up Form */
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(isSignUp ? onSignUp : onSignIn)} className="space-y-4">
                  {isSignUp && (
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            Display Name
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <Input 
                                placeholder="Enter your display name"
                                className="pl-10 h-9 text-sm border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
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
                        <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                              placeholder="Enter your email"
                              className="pl-10 h-9 text-sm border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
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
                        <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="pl-10 pr-10 h-9 text-sm border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                              {...field} 
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
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
                        className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full h-9 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white transition-colors" 
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;