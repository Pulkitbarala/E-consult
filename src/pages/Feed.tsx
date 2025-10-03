import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Consultation {
  id: string;
  title: string;
  description: string;
  category: string;
  expires_at: string;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_url?: string;
  };
  comment_count: number;
}

const Feed = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      // If user is signed in, fetch consultation ids they've commented on so we can exclude them
      let commentedIds: string[] = [];
      if (user) {
        const { data: userComments, error: userCommentsError } = await supabase
          .from('comments')
          .select('consultation_id')
          .eq('user_id', user.id);

        if (userCommentsError) throw userCommentsError;

        commentedIds = [...new Set(userComments?.map((c: any) => c.consultation_id))];
      }

      const { data, error } = await supabase
        .from('consultations')
        .select(`
          id,
          title,
          description,
          category,
          expires_at,
          created_at,
          user_id
        `)
        .gt('expires_at', new Date().toISOString())
  .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setConsultations([]);
        return;
      }

      // Filter out consultations the user already commented on
      const filtered = commentedIds.length > 0 ? data.filter((c: any) => !commentedIds.includes(c.id)) : data;

      // Use filtered list (exclude ones user already commented on)
      const consultationsData = filtered;

      // Get profiles for all consultation authors
      const userIds = [...new Set(consultationsData.map((c: any) => c.user_id))];
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      // Get comment counts for each consultation
  const consultationIds = consultationsData.map((c: any) => c.id);
      const { data: commentCounts, error: countError } = await supabase
        .from('comments')
        .select('consultation_id')
        .in('consultation_id', consultationIds);

      if (countError) throw countError;

      // Create lookup maps
      const profileMap = profiles?.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      const countMap = commentCounts?.reduce((acc, comment) => {
        acc[comment.consultation_id] = (acc[comment.consultation_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Combine all data
      const consultationsWithData = consultationsData.map((consultation: any) => ({
        ...consultation,
        profiles: profileMap[consultation.user_id] || { display_name: 'Unknown User' },
        comment_count: countMap[consultation.id] || 0,
      }));

      setConsultations(consultationsWithData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load consultations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const timeLeft = expiry.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'Expired';
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="h-10 bg-muted rounded w-96 mx-auto animate-pulse"></div>
          <div className="h-6 bg-muted rounded w-80 mx-auto animate-pulse"></div>
        </div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-l-4 border-l-muted animate-pulse">
              <CardHeader className="pb-4">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="h-6 bg-muted rounded w-24"></div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-muted rounded-full"></div>
                      <div className="space-y-1">
                        <div className="h-4 bg-muted rounded w-24"></div>
                        <div className="h-3 bg-muted rounded w-20"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold">Active Consultations</h1>
        <p className="text-lg text-muted-foreground">
          Explore ongoing discussions and share your insights
        </p>
      </div>

      {consultations.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <MessageSquare className="w-16 h-16 mx-auto mb-6 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-3">No active consultations</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Be the first to start a consultation and get expert advice from the community!
            </p>
            <Link
              to="/create"
              className="inline-flex items-center px-6 py-3 btn-primary-gradient rounded-md hover:opacity-90 transition-opacity font-medium"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Create Consultation
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {consultations.map((consultation) => (
            <Link key={consultation.id} to={`/consultation/${consultation.id}`} className="block">
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary group">
                <CardHeader className="pb-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-sm">{consultation.category}</Badge>
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {getTimeLeft(consultation.expires_at)}
                      </div>
                    </div>
                    
                    <CardTitle className="text-2xl font-bold leading-tight group-hover:text-primary transition-colors">
                      {consultation.title}
                    </CardTitle>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={consultation.profiles?.avatar_url} />
                          <AvatarFallback className="text-sm">
                            {consultation.profiles?.display_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{consultation.profiles?.display_name}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(consultation.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <MessageSquare className="w-4 h-4" />
                        <span className="font-medium">{consultation.comment_count}</span>
                        <span>comments</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground line-clamp-3 leading-relaxed">
                      {consultation.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;