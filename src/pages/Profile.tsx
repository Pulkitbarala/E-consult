import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { MessageSquare, Activity, MessageCircle, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Username must be at least 2 characters')
    .max(50, 'Username must be less than 50 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface UserProfile {
  id: string;
  user_id?: string;
  display_name: string;
  bio?: string | null;
}

interface UserStats {
  totalConsultations: number;
  activeNow: number;
  commentsPosted: number;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: '', bio: '' },
  });

  useEffect(() => {
    if (user) {
      // Fetch profile and stats in parallel for faster loading
      Promise.all([fetchProfile(), fetchUserStats()]).then(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile(data as UserProfile);
        form.reset({ display_name: data.display_name, bio: data.bio || '' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
    }
  };

  const fetchUserStats = async () => {
    setStatsLoading(true);
    try {
      // Use Promise.all to fetch all stats in parallel for faster loading
      const [consultationsResult, activeResult, commentsResult] = await Promise.all([
        supabase
          .from('consultations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id),
        supabase
          .from('consultations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id)
          .eq('status', 'active'),
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id)
      ]);

      setStats({
        totalConsultations: consultationsResult.count || 0,
        activeNow: activeResult.count || 0,
        commentsPosted: commentsResult.count || 0,
      });
    } catch (err: any) {
      console.error('Failed to fetch user stats:', err);
      // Set to zeros if fetching fails
      setStats({
        totalConsultations: 0,
        activeNow: 0,
        commentsPosted: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const onSubmit = async (values: ProfileForm) => {
    setUpdating(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;
      if (!currentUser) {
        toast({ title: 'Sign in required', description: 'Please sign in to update profile', variant: 'destructive' });
        setUpdating(false);
        return;
      }

      const payload = { user_id: currentUser.id, display_name: values.display_name, bio: values.bio || null };

      if (profile) {
        const { error } = await supabase
          .from('profiles')
          .update({ display_name: payload.display_name, bio: payload.bio })
          .eq('user_id', currentUser.id);
        if (error) throw error;
        setProfile(prev => (prev ? { ...prev, ...payload } : { id: '', ...payload }));
      } else {
        const { error } = await supabase.from('profiles').insert(payload);
        if (error) throw error;
        setProfile({ id: '', ...payload });
      }

      toast({ title: 'Saved', description: 'Your profile has been updated.' });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err.message || 'Update failed', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const initials = useMemo(() => {
    const name = profile?.display_name || user?.email?.split('@')[0] || 'User';
    return name
      .split(' ')
      .slice(0, 2)
      .map(s => s.charAt(0).toUpperCase())
      .join('');
  }, [profile, user]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Profile</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Manage your account settings and view your activity
        </p>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Consultations */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Total Consultations
                </p>
                {statsLoading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {stats?.totalConsultations ?? 0}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Now */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Active Now
                </p>
                {statsLoading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {stats?.activeNow ?? 0}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Posted */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg">
                <MessageCircle className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Comments Posted
                </p>
                {statsLoading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {stats?.commentsPosted ?? 0}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Edit Profile</CardTitle>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Update your profile information
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Info Display */}
          <div className="flex items-center space-x-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-base font-medium text-slate-600 dark:text-slate-300">
              {initials}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {user?.email}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
              </p>
            </div>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your username"
                        className="h-9 text-sm"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about yourself..."
                        className="min-h-[80px] resize-none text-sm"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-slate-500">
                      {field.value ? `${field.value.length}/500 characters` : '0/500 characters'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={updating}
                className="w-auto px-4 h-9 text-sm"
              >
                {updating ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="w-3 h-3 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;