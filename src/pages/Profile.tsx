import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { api } from '@/services/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import RollingDigits from '@/components/RollingDigits';
import { cacheGet, cacheSet, CACHE_KEYS } from '@/services/requestCache';

const STATS_CACHE_TTL_MS = 300000;
const STATS_REFRESH_DELAY_MS = 5000;
const STATS_STORAGE_TTL_MS = 3600000;
const STATS_STORAGE_KEY_PREFIX = 'ecs:user_stats:';

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

const getStatsStorageKey = (userId: string) => `${STATS_STORAGE_KEY_PREFIX}${userId}`;

const readStoredStats = (storageKey: string): UserStats | null => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: UserStats; timestamp: number } | null;
    if (!parsed?.data || typeof parsed.timestamp !== 'number') return null;
    const age = Date.now() - parsed.timestamp;
    if (age > STATS_STORAGE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

const writeStoredStats = (storageKey: string, data: UserStats): void => {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
};

const getCachedStats = (cacheKey: string, storageKey: string): UserStats | null => {
  const cached = cacheGet<UserStats>(cacheKey);
  if (cached) return cached;

  const stored = readStoredStats(storageKey);
  if (stored) {
    cacheSet(cacheKey, stored, STATS_CACHE_TTL_MS);
  }
  return stored;
};

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(() => {
    if (!user?.id) return null;
    const statsCacheKey = `${CACHE_KEYS.STATS}_${user.id}`;
    const statsStorageKey = getStatsStorageKey(user.id);
    return getCachedStats(statsCacheKey, statsStorageKey);
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(() => !stats);
  const [updating, setUpdating] = useState(false);
  const statsRefreshTimeoutRef = useRef<number | null>(null);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: '', bio: '' },
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return undefined;
    }

    const statsCacheKey = `${CACHE_KEYS.STATS}_${user.id}`;
    const statsStorageKey = getStatsStorageKey(user.id);
    const cachedStats = getCachedStats(statsCacheKey, statsStorageKey);
    if (cachedStats) {
      setStats(cachedStats);
      setStatsLoading(false);
      statsRefreshTimeoutRef.current = window.setTimeout(() => {
        fetchUserStats({ silent: true, cacheKey: statsCacheKey, storageKey: statsStorageKey });
      }, STATS_REFRESH_DELAY_MS);
    }

    Promise.all([
      fetchProfile(),
      cachedStats
        ? Promise.resolve()
        : fetchUserStats({ cacheKey: statsCacheKey, storageKey: statsStorageKey }),
    ]).finally(() => setLoading(false));

    return () => {
      if (statsRefreshTimeoutRef.current) {
        window.clearTimeout(statsRefreshTimeoutRef.current);
        statsRefreshTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await api.getProfile();
      if (res.profile) {
        setProfile(res.profile as UserProfile);
        form.reset({ display_name: res.profile.display_name, bio: res.profile.bio || '' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
    }
  };

  const fetchUserStats = async (
    {
      silent = false,
      cacheKey,
      storageKey,
    }: { silent?: boolean; cacheKey?: string; storageKey?: string } = {}
  ) => {
    if (!silent) setStatsLoading(true);
    try {
      const stats = await api.getStats();
      const nextStats = {
        totalConsultations: stats.totalConsultations,
        activeNow: stats.activeNow,
        commentsPosted: stats.commentsPosted,
      };
      setStats(nextStats);
      cacheSet(cacheKey || CACHE_KEYS.STATS, nextStats, STATS_CACHE_TTL_MS);
      if (storageKey) writeStoredStats(storageKey, nextStats);
    } catch (err: any) {
      console.error('Failed to fetch user stats:', err);
      if (!silent) {
        setStats({ totalConsultations: 0, activeNow: 0, commentsPosted: 0 });
      }
    } finally {
      if (!silent) setStatsLoading(false);
    }
  };

  const onSubmit = async (values: ProfileForm) => {
    setUpdating(true);
    try {
      await api.updateProfile({ display_name: values.display_name, bio: values.bio || null });
      setProfile(prev => (prev ? { ...prev, display_name: values.display_name, bio: values.bio || null } : { id: '', display_name: values.display_name, bio: values.bio || null }));
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8 animate-fade-in">
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
        <Card className="glass-card-pro bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Total Posts
                </p>
                {statsLoading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    <RollingDigits value={stats?.totalConsultations ?? 0} />
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Now */}
        <Card className="glass-card-pro bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 backdrop-blur-xl">
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
                    <RollingDigits value={stats?.activeNow ?? 0} />
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Posted */}
        <Card className="glass-card-pro bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 backdrop-blur-xl">
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
                    <RollingDigits value={stats?.commentsPosted ?? 0} />
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Section */}
      <Card className="glass-card-pro bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Edit Profile</CardTitle>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Update your profile information
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Info Display */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
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