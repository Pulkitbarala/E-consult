import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, type SignInForm } from '@/schemas/authSchemas';
import { SharedAuthLayout } from '@/components/auth/SharedAuthLayout';
import { Captcha } from '@/components/auth/Captcha';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { signInWithEmail } from '@/services/authService';
import { useCaptchaConfig } from '@/hooks/useCaptchaConfig';

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const { config, loading: captchaLoading, error: captchaError } = useCaptchaConfig();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const captchaRequired = Boolean(config?.siteKey) || Boolean(captchaError);

  const onSubmit = async (data: SignInForm) => {
    setLoading(true);
    setSignInError(null);
    try {
      const { error } = await signInWithEmail(data.email, data.password, captchaToken);
      if (error) {
        const message = error.message || 'Invalid email or password.';
        setSignInError(message);
        setCaptchaResetSignal((value) => value + 1);
      } else {
        toast({ title: 'Welcome back!', description: 'You have successfully signed in.' });
        const from = (location.state as any)?.from?.pathname || '/feed';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const message = err?.message || 'Invalid email or password.';
      setSignInError(message);
      setCaptchaResetSignal((value) => value + 1);
    } finally {
      setLoading(false);
      setCaptchaToken(null);
    }
  };

  return (
    <SharedAuthLayout
      title="Welcome Back"
      description="Sign in to continue your journey"
      icon={<User className="w-5 h-5 text-yellow" />}
      activeMode="signin"
      showModeToggle
      backReplace
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {signInError && (
            <Alert
              variant="destructive"
              className="border-red-200/40 bg-white/40 dark:bg-slate-900/35 backdrop-blur-xl shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
            >
              <AlertTitle>Sign in failed</AlertTitle>
              <AlertDescription>{signInError}</AlertDescription>
            </Alert>
          )}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Email Address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Enter your email"
                      className="pl-10 h-9 text-sm border-slate-300/70 dark:border-slate-600/70 focus:border-indigo-500 dark:focus:border-indigo-400"
                      {...field}
                      onChange={(event) => {
                        if (signInError) setSignInError(null);
                        field.onChange(event);
                      }}
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
                <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 h-9 text-sm border-slate-300/70 dark:border-slate-600/70 focus:border-indigo-500 dark:focus:border-indigo-400"
                      {...field}
                      onChange={(event) => {
                        if (signInError) setSignInError(null);
                        field.onChange(event);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/auth?mode=reset', { replace: true })}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              Forgot password?
            </button>
          </div>

          <Captcha onToken={setCaptchaToken} resetSignal={captchaResetSignal} />

          <Button
            type="submit"
            className="w-full h-9 text-sm font-medium"
            disabled={loading || captchaLoading || captchaError != null || (captchaRequired && !captchaToken)}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </Form>
    </SharedAuthLayout>
  );
}
