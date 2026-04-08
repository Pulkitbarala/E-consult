import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SharedAuthLayout } from '@/components/auth/SharedAuthLayout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { newPasswordSchema, type NewPasswordForm } from '@/schemas/authSchemas';
import { updatePassword as updatePasswordService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function UpdatePasswordValid() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const form = useForm<NewPasswordForm>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: NewPasswordForm) => {
    setLoading(true);
    try {
      const { error } = await updatePasswordService(data.password);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Password updated successfully', description: 'Redirecting to sign in...' });
        await signOut();
        setTimeout(() => navigate('/auth?mode=signin', { replace: true }), 1200);
      }
    } catch (err) {
      console.error('Password update failed:', err);
      toast({ title: 'Error', description: 'An error occurred while updating your password.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SharedAuthLayout
      title="Set New Password"
      description="Create a secure password for your account"
      icon={<Lock className="w-5 h-5 text-white" />}
      showModeToggle={false}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your new password"
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

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Confirm New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      className="pl-10 pr-10 h-9 text-sm border-slate-300/70 dark:border-slate-600/70 focus:border-indigo-500 dark:focus:border-indigo-400"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full h-9 text-sm font-medium" disabled={loading}>
            {loading ? 'Updating password...' : (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Update Password</span>
              </div>
            )}
          </Button>
        </form>
      </Form>
    </SharedAuthLayout>
  );
}
