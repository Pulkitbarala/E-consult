import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Clock, Plus, FileText, Edit, Eye, X, BarChart3 } from 'lucide-react';
import { api } from '@/services/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Consultation {
  id: string;
  title: string;
  description: string;
  category: string;
  expires_at: string | null;
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
      const res = await api.listMyConsultations();
      const data = res.items || [];
      const now = new Date();

      const active: Consultation[] = [];
      const expired: Consultation[] = [];

      data.forEach((c: any) => {
        const expiresAt = c.expires_at ? new Date(c.expires_at) : null;
        // If no expiry is set or the date is invalid, keep it active
        if (!expiresAt || isNaN(expiresAt.getTime())) {
          active.push(c);
          return;
        }
        if (expiresAt <= now) {
          expired.push(c);
        } else {
          active.push(c);
        }
      });

      setActiveConsultations(active);
      setExpiredConsultations(expired);
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to load your consultations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleExpire = async (consultationId: string, title: string) => {
    // Confirm with user before expiring
    const confirmed = window.confirm(
      `Are you sure you want to expire "${title}"? This action cannot be undone and will prevent further comments.`
    );

    if (!confirmed) return;

    try {
      const res = await api.expireConsultation(consultationId);

      toast({
        title: 'Success!',
        description: 'Consultation has been expired successfully.',
      });

      // Optimistically remove from active; refetch will place it into expired
      setActiveConsultations((prev) => prev.filter((c) => c.id !== consultationId));

      // Refresh the consultations list
      fetchConsultations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to expire consultation.',
        variant: 'destructive',
      });
    }
  };

  const getTimeLeft = (expiresAt: string) => {
    if (!expiresAt) return 'No expiry';
    const now = new Date();
    const expiry = new Date(expiresAt);
    if (isNaN(expiry.getTime())) return 'No expiry';
    const timeLeft = expiry.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'Expired';
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const renderConsultations = (consultations: Consultation[], showExpired = false) => (
    <div className="space-y-4 animate-fade-in">
      {consultations.length === 0 ? (
        <Card className="glass-card-pro bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 backdrop-blur-xl text-center py-12">
          <CardContent>
            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400 opacity-50" />
            <h3 className="text-lg font-medium mb-2 text-slate-900 dark:text-white">
              {showExpired ? 'No expired consultations' : 'No active consultations'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-md mx-auto">
              {showExpired 
                ? 'Your expired consultations will appear here'
                : 'Create your first consultation to get expert advice from the community!'
              }
            </p>
            {!showExpired && (
              <Link to="/create" replace>
                <Button className="h-9 px-4 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
                  <Plus className="w-3 h-3 mr-2" />
                  Create Consultation
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        consultations.map((consultation) => (
          <Card
            key={consultation.id}
            className="glass-card-pro bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 backdrop-blur-xl"
          >
            <CardHeader className="pb-3">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {consultation.category.split(', ').map((cat, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-2 py-1">{cat}</Badge>
                    ))}
                    {showExpired && <Badge variant="destructive" className="text-xs px-2 py-1">Expired</Badge>}
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    {getTimeLeft(consultation.expires_at)}
                  </div>
                </div>
                
                <CardTitle className="text-lg font-medium leading-tight break-words text-slate-900 dark:text-white">
                  {consultation.title}
                </CardTitle>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(new Date(consultation.created_at), { addSuffix: true })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      <span className="font-medium">{consultation.comment_count}</span>
                      <span>comments</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link to={`/consultation/${consultation.id}`} replace>
                      <Button variant="outline" size="sm" className="h-8 w-full sm:w-auto px-3 text-xs hover:bg-slate-100 transition-all duration-200">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link to={`/dashboard/${consultation.id}`} replace>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-full sm:w-auto px-3 text-xs hover:bg-slate-100 transition-all duration-200"
                      >
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Analyze
                      </Button>
                    </Link>
                    {!showExpired && (
                      <>
                        <Link to={`/consultation/${consultation.id}?edit=true`} replace>
                          <Button variant="outline" size="sm" className="h-8 w-full sm:w-auto px-3 text-xs hover:bg-slate-100 transition-all duration-200">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleExpire(consultation.id, consultation.title)}
                          className="h-8 w-full sm:w-auto px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Close
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {consultation.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-80"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-96"></div>
            </div>
            <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
          </div>
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card
                key={i}
                className="glass-card-pro bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 backdrop-blur-xl"
              >
                <CardHeader className="pb-3">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                    </div>
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                      </div>
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">My Consultations</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage and track your consultation requests
          </p>
        </div>
        <Link to="/create" replace>
          <Button className="h-9 px-4 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
            <Plus className="w-3 h-3 mr-2" />
            Create New
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-10">
          <TabsTrigger value="active" className="text-sm font-medium">
            Active ({activeConsultations.length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="text-sm font-medium">
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