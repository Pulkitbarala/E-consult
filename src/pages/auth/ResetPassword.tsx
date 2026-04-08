import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordForm } from '@/schemas/authSchemas';
import { SharedAuthLayout } from '@/components/auth/SharedAuthLayout';
import { Captcha } from '@/components/auth/Captcha';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mail, Send } from 'lucide-react';
import { sendResetPasswordEmail } from '@/services/authService';
import { useCaptchaConfig } from '@/hooks/useCaptchaConfig';

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { config, loading: captchaLoading, error: captchaError } = useCaptchaConfig();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handlePopState = () => {
      navigate('/auth?mode=signin', { replace: true });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '' },
  });

  const captchaRequired = Boolean(config?.siteKey) || Boolean(captchaError);

  const onSubmit = async (data: ResetPasswordForm) => {
    setLoading(true);
    try {
      const { error } = await sendResetPasswordEmail(data.email, captchaToken);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({
          title: 'Check your email',
          description: 'We sent you a password reset link. Please check your email.',
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
      title="Reset Password"
      description="Enter your email to receive a password reset link"
      icon={<Mail className="w-5 h-5 text-white" />}
      activeMode="reset"
      showModeToggle={false}
      backTo="/auth?mode=signin"
      backReplace
    >
      <div className="flex items-center space-x-2 mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/auth?mode=signin', { replace: true })}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          Back to Sign In
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

          <Captcha onToken={setCaptchaToken} />

          <Button
            type="submit"
            className="w-full h-9 text-sm font-medium"
            disabled={loading || captchaLoading || captchaError != null || (captchaRequired && !captchaToken)}
          >
            {loading ? 'Sending reset link...' : (
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4" />
                <span>Send Reset Link</span>
              </div>
            )}
          </Button>
        </form>
      </Form>
    </SharedAuthLayout>
  );
}
