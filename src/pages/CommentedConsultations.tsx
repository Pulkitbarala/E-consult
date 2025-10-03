import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Consultation {
  id: string;
  title: string;
  description: string;
  category: string;
  expires_at: string;
  created_at: string;
  comment_count: number;
}

const CommentedConsultations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchCommented();
  }, [user]);

  const fetchCommented = async () => {
    try {
      // Get consultation ids that the user has commented on
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('consultation_id')
        .eq('user_id', user?.id);

      if (commentsError) throw commentsError;

      const consultationIds = [...new Set(comments?.map((c: any) => c.consultation_id))];

      if (!consultationIds || consultationIds.length === 0) {
        setConsultations([]);
        return;
      }

      const { data, error } = await supabase
        .from('consultations')
        .select('id, title, description, category, expires_at, created_at')
        .in('id', consultationIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get comment counts for these consultations
      const { data: commentCounts, error: countError } = await supabase
        .from('comments')
        .select('consultation_id')
        .in('consultation_id', consultationIds);

      if (countError) throw countError;

      const countMap = commentCounts?.reduce((acc: any, comment: any) => {
        acc[comment.consultation_id] = (acc[comment.consultation_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const consultationsWithCounts = data.map((consultation: any) => ({
        ...consultation,
        comment_count: countMap[consultation.id] || 0,
      }));

      setConsultations(consultationsWithCounts);
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to load commented consultations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="animate-pulse">
          <div className="space-y-3 mb-8">
            <div className="h-10 bg-muted rounded w-96"></div>
            <div className="h-6 bg-muted rounded w-80"></div>
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-l-4 border-l-muted">
                <CardHeader className="pb-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="h-6 bg-muted rounded w-24"></div>
                      <div className="h-4 bg-muted rounded w-20"></div>
                    </div>
                    <div className="h-8 bg-muted rounded w-3/4"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-4 bg-muted rounded w-24"></div>
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
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold">Commented Consultations</h1>
        <p className="text-lg text-muted-foreground">
          Consultations you have participated in and helped with your insights
        </p>
      </div>

      {consultations.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <MessageSquare className="w-16 h-16 mx-auto mb-6 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-3">No commented consultations</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start engaging with the community by commenting on consultations and sharing your insights!
            </p>
            <Link
              to="/feed"
              className="inline-flex items-center px-6 py-3 btn-primary-gradient rounded-md hover:opacity-90 transition-opacity font-medium"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Browse Consultations
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
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MessageSquare className="w-4 h-4" />
                        <span className="font-medium">{consultation.comment_count}</span>
                        <span>comments</span>
                      </div>
                    </div>
                    
                    <CardTitle className="text-2xl font-bold leading-tight group-hover:text-primary transition-colors">
                      {consultation.title}
                    </CardTitle>
                    
                    <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDistanceToNow(new Date(consultation.created_at), { addSuffix: true })}</span>
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

export default CommentedConsultations;
