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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { User, Save, Edit3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface UserProfile {
  id: string;
  user_id?: string;
  display_name: string;
  bio?: string | null;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: '', bio: '' },
  });

  useEffect(() => {
    if (user) fetchProfile();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Manage your personal information and how you appear to others on the platform
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Overview Card */}
        <div className="lg:col-span-1">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg">
                  {initials}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {profile?.display_name || user?.email?.split('@')[0] || 'User'}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {profile?.bio || 'No bio added yet. Tell people about yourself!'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Email</span>
                    <span className="text-sm text-muted-foreground truncate max-w-[180px]">
                      {user?.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Member since</span>
                    <span className="text-sm text-muted-foreground">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Edit Profile Form */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                Edit Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="display_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Display Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your display name" 
                            className="h-12"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                        <div className="text-sm text-muted-foreground">
                          {field.value ? `${field.value.length}/50 characters` : '0/50 characters'}
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell people about yourself, your interests, expertise..." 
                            className="min-h-[120px] resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Share something interesting about yourself. This will be visible to other users.
                        </FormDescription>
                        <FormMessage />
                        <div className="text-sm text-muted-foreground">
                          {field.value ? `${field.value.length}/500 characters` : '0/500 characters'}
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center gap-4 pt-4">
                    <Button 
                      type="submit" 
                      disabled={updating}
                      className="px-8 h-12"
                    >
                      {updating ? (
                        'Saving...'
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => form.reset()}
                      className="px-6 h-12"
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-xl">Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-lg font-bold text-primary-foreground shadow-md">
                  {initials}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold truncate">
                      {form.watch('display_name') || profile?.display_name || user?.email?.split('@')[0] || 'User'}
                    </h3>
                    <span className="text-sm text-muted-foreground truncate ml-2">
                      {user?.email}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {form.watch('bio') || profile?.bio || 'No bio added yet.'}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;