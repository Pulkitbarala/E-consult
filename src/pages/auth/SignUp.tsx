import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpForm } from '@/schemas/authSchemas';
import { SharedAuthLayout } from '@/components/auth/SharedAuthLayout';
import { Captcha } from '@/components/auth/Captcha';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mail, Lock, Eye, EyeOff, User, Sparkles } from 'lucide-react';
import { signUpWithEmail } from '@/services/authService';
import { useCaptchaConfig } from '@/hooks/useCaptchaConfig';

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { config, loading: captchaLoading, error: captchaError } = useCaptchaConfig();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', displayName: '' },
  });

  const captchaRequired = Boolean(config?.siteKey) || Boolean(captchaError);

  const onSubmit = async (data: SignUpForm) => {
    setLoading(true);
    try {
      const { error } = await signUpWithEmail(data.email, data.password, data.displayName, captchaToken);
      if (error) {
        toast({ title: 'Sign Up Failed', description: error.message, variant: 'destructive' });
      } else {
        toast({
          title: 'Account created!',
          description: 'Please check your email to verify your account.',
        });
        navigate('/auth?mode=signin', { replace: true });
      }
    } finally {
      setLoading(false);
      setCaptchaToken(null);
    }
  };

  return (
    <SharedAuthLayout
      title="Create Account"
      description="Join the professional consultation platform"
      icon={<Sparkles className="w-5 h-5 text-yellow" />}
      activeMode="signup"
      showModeToggle
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Display Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Enter your display name"
                      className="pl-10 h-9 text-sm border-slate-300/70 dark:border-slate-600/70 focus:border-indigo-500 dark:focus:border-indigo-400"
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

          <Captcha onToken={setCaptchaToken} />

          <Button
            type="submit"
            className="w-full h-9 text-sm font-medium"
            disabled={loading || captchaLoading || captchaError != null || (captchaRequired && !captchaToken)}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </Form>
    </SharedAuthLayout>
  );
}
