import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Clock, User } from 'lucide-react';
import { api } from '@/services/apiClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { onDebouncedEvent, EVENTS } from '@/services/eventEmitter';
import { cacheGet, cacheSet, cacheClear, CACHE_KEYS } from '@/services/requestCache';
import { smartPoll } from '@/services/visibilityManager';

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
  const lastErrorAtRef = useRef(0);

  useEffect(() => {
    // Fetch immediately on mount
    fetchConsultations();
    
    // Listen to comment posted event with debouncing (only refetch 1s after last comment)
    // This prevents rapid repeated API calls when multiple comments are posted quickly
    const unsubscribeComment = onDebouncedEvent(
      EVENTS.COMMENT_POSTED,
      async () => {
        cacheClear(CACHE_KEYS.CONSULTATIONS);
        await fetchConsultations();
      },
      1000 // Wait 1 second after last event before fetching
    );
    
    // Smart polling: only poll when page is visible, every 30 seconds
    // This reduces server load significantly by not polling hidden tabs
    const unsubscribePolling = smartPoll(
      async () => {
        await fetchConsultations({ silent: true });
      },
      30000, // Poll every 30 seconds instead of continuously
      false // Don't start immediately (we already fetched above)
    );
    
    return () => {
      unsubscribeComment();
      unsubscribePolling();
    };
  }, []);

  const fetchConsultations = async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      // Check cache first - if we have fresh data (< 5s), use it
      const cached = cacheGet<{ items: any[] }>(CACHE_KEYS.CONSULTATIONS);
      if (cached) {
        const data = cached.items || [];
        const active = data.filter((c) => !c.expires_at || new Date(c.expires_at) > new Date());
        setConsultations(active as Consultation[]);
        return;
      }
      
      const res = await api.listConsultations();
      const data = (res.items || []) as any[];
      
      // Cache the response for 5 seconds
      cacheSet(CACHE_KEYS.CONSULTATIONS, res, 5000);
      
      // Only show active ones by expiry
      const active = data.filter((c) => !c.expires_at || new Date(c.expires_at) > new Date());
      setConsultations(active as Consultation[]);
    } catch (error: any) {
      const now = Date.now();
      if (!silent && now - lastErrorAtRef.current > 20000) {
        toast({ title: 'Error', description: 'Failed to load consultations', variant: 'destructive' });
        lastErrorAtRef.current = now;
      }
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
      <div className="max-w-4xl mx-auto space-y-6 p-4 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-80 mx-auto animate-pulse"></div>
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-64 mx-auto animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card
              key={i}
              className="glass-card-pro bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 backdrop-blur-xl border-l-4 border-l-slate-300 dark:border-l-slate-600 animate-pulse"
            >
              <CardHeader className="pb-3">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                  </div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                      <div className="space-y-1">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
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
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Active Consultations</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Explore ongoing discussions and share your insights
        </p>
      </div>

      {consultations.length === 0 ? (
        <Card className="glass-card-pro bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 backdrop-blur-xl text-center py-12">
          <CardContent>
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-slate-600 opacity-50" />
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">No active consultations</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-md mx-auto text-sm">
              Be the first to start a consultation and get expert advice from the community!
            </p>
            <Link
              to="/create"
              replace
              className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-md transition-colors text-sm font-medium"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Create Consultation
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {consultations.map((consultation) => (
            <Link key={consultation.id} to={`/consultation/${consultation.id}`} replace className="block">
              <Card className="glass-card-pro bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 backdrop-blur-xl border-l-4 border-l-slate-500 dark:border-l-slate-400 group">
                <CardHeader className="pb-3">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {consultation.category.split(', ').map((cat, index) => (
                          <Badge key={index} variant="secondary" className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{cat}</Badge>
                        ))}
                      </div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {getTimeLeft(consultation.expires_at)}
                      </div>
                    </div>
                    
                    <CardTitle className="text-lg font-bold leading-tight break-words group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors text-slate-900 dark:text-slate-100">
                      {consultation.title}
                    </CardTitle>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={consultation.profiles?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {consultation.profiles?.display_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-xs text-slate-700 dark:text-slate-300">{consultation.profiles?.display_name}</div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(consultation.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
                        <MessageSquare className="w-3 h-3" />
                        <span className="font-medium">{consultation.comment_count}</span>
                        <span>comments</span>
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

export default Feed;