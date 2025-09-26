import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Clock, Plus, FileText, Edit, Eye } from 'lucide-react';
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

const MyConsultations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeConsultations, setActiveConsultations] = useState<Consultation[]>([]);
  const [expiredConsultations, setExpiredConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConsultations();
    }
  }, [user]);

  const fetchConsultations = async () => {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('id, title, description, category, expires_at, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setActiveConsultations([]);
        setExpiredConsultations([]);
        return;
      }

      // Get comment counts
      const consultationIds = data.map(c => c.id);
      const { data: commentCounts, error: countError } = await supabase
        .from('comments')
        .select('consultation_id')
        .in('consultation_id', consultationIds);

      if (countError) throw countError;

      const countMap = commentCounts?.reduce((acc, comment) => {
        acc[comment.consultation_id] = (acc[comment.consultation_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const consultationsWithCounts = data.map(consultation => ({
        ...consultation,
        comment_count: countMap[consultation.id] || 0,
      }));

      const now = new Date();
      const active = consultationsWithCounts.filter(c => new Date(c.expires_at) > now);
      const expired = consultationsWithCounts.filter(c => new Date(c.expires_at) <= now);

      setActiveConsultations(active);
      setExpiredConsultations(expired);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load your consultations',
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

  const renderConsultations = (consultations: Consultation[], showExpired = false) => (
    <div className="space-y-4">
      {consultations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {showExpired ? 'No expired consultations' : 'No active consultations'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {showExpired 
                ? 'Your expired consultations will appear here'
                : 'Create your first consultation to get started!'
              }
            </p>
            {!showExpired && (
              <Link to="/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Consultation
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        consultations.map((consultation) => (
          <Card key={consultation.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{consultation.category}</Badge>
                    {showExpired && <Badge variant="destructive">Expired</Badge>}
                  </div>
                  <CardTitle className="text-xl line-clamp-2">
                    {consultation.title}
                  </CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDistanceToNow(new Date(consultation.created_at), { addSuffix: true })}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{consultation.comment_count} comments</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="text-xs text-muted-foreground">
                    {getTimeLeft(consultation.expires_at)}
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/consultation/${consultation.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    {!showExpired && (
                      <Link to={`/consultation/${consultation.id}?edit=true`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground line-clamp-3">
                {consultation.description}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Consultations</h1>
          <p className="text-muted-foreground">
            Manage and track your consultation requests
          </p>
        </div>
        <Link to="/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            Active ({activeConsultations.length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired ({expiredConsultations.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-6">
          {renderConsultations(activeConsultations)}
        </TabsContent>
        
        <TabsContent value="expired" className="mt-6">
          {renderConsultations(expiredConsultations, true)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyConsultations;