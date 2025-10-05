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
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <div className="animate-pulse">
          <div className="space-y-2 mb-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-80"></div>
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-64"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-l-4 border-l-slate-300 dark:border-l-slate-600">
                <CardHeader className="pb-3">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                    </div>
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
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
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Commented Consultations</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Consultations you have participated in and helped with your insights
        </p>
      </div>

      {consultations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-slate-600 opacity-50" />
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">No commented consultations</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-md mx-auto text-sm">
              Start engaging with the community by commenting on consultations and sharing your insights!
            </p>
            <Link
              to="/feed"
              className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-md transition-colors text-sm font-medium"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Browse Consultations
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {consultations.map((consultation) => (
            <Link key={consultation.id} to={`/consultation/${consultation.id}`} className="block">
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-slate-500 dark:border-l-slate-400 group">
                <CardHeader className="pb-3">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {consultation.category.split(', ').map((cat, index) => (
                          <Badge key={index} variant="secondary" className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{cat}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <MessageSquare className="w-3 h-3" />
                        <span className="font-medium">{consultation.comment_count}</span>
                        <span>comments</span>
                      </div>
                    </div>
                    
                    <CardTitle className="text-lg font-bold leading-tight group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors text-slate-900 dark:text-slate-100">
                      {consultation.title}
                    </CardTitle>
                    
                    <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDistanceToNow(new Date(consultation.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed text-sm">
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
