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
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
});

type SignInForm = z.infer<typeof signInSchema>;
type SignUpForm = z.infer<typeof signUpSchema>;
type AuthForm = SignInForm | SignUpForm;

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Use a single form with conditional schema
  const form = useForm<AuthForm>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: {
      email: '',
      password: '',
      ...(isSignUp && { displayName: '' }),
    },
  });

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
    // Reset form when switching modes
    form.reset({
      email: '',
      password: '',
      ...(isSignUp && { displayName: '' }),
    });
  };

  const onSubmit = async (data: AuthForm) => {
    if (isSignUp) {
      await onSignUp(data as SignUpForm);
    } else {
      await onSignIn(data as SignInForm);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      {/* Navbar */}
      <header className="w-full py-4 px-6 flex justify-between items-center bg-white dark:bg-gray-800 shadow-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')} 
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Button>
        <ThemeToggle />
      </header>

      {/* Auth Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 border-b border-gray-300 dark:border-gray-700">
              <Button
                variant="ghost"
                onClick={() => setIsSignUp(false)}
                className={`w-1/2 rounded-none relative ${!isSignUp ? 'bg-primary text-white' : 'bg-transparent text-gray-700 dark:text-gray-400'}`}
              >
                Sign In
                {!isSignUp && <span className="absolute bottom-0 left-0 w-full h-1 bg-primary dark:bg-primary"></span>}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsSignUp(true)}
                className={`w-1/2 rounded-none relative ${isSignUp ? 'bg-primary text-white' : 'bg-transparent text-gray-700 dark:text-gray-400'}`}
              >
                Sign Up
                {isSignUp && <span className="absolute bottom-0 left-0 w-full h-1 bg-primary dark:bg-primary"></span>}
              </Button>
            </div>
            <CardTitle className="text-3xl font-extrabold">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? 'Join the E-Consultation platform'
                : 'Sign in to your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={(e) => {
                  e.preventDefault(); // Prevent default form submission
                  form.handleSubmit(isSignUp ? onSignUp : onSignIn)(e);
                }}
              >
                {isSignUp && (
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your display name" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email" {...field} />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full mt-4" disabled={loading}>
                  {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;