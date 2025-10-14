import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, User, MessageSquare, Send, Edit, Trash2, MoreHorizontal, Heart, X } from 'lucide-react';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Consultation {
  id: string;
  title: string;
  description: string;
  category: string;
  expires_at: string;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string;
    avatar_url?: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string;
    avatar_url?: string;
  };
  like_count?: number;
  liked_by_user?: boolean;
  sentimenttype?: string | null;
  score?: number | null;
  keyword?: string | null;
}

const ConsultationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  // Track which comment is being edited and its draft content
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  // Likes state handled per comment
  // We'll store like counts and whether current user liked each comment on the comment objects
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(consultation?.title || '');
  const [editedDescription, setEditedDescription] = useState(consultation?.description || '');

  useEffect(() => {
    if (id) {
      fetchConsultation();
      fetchComments();
      subscribeToComments();
    }
  }, [id]);

  useEffect(() => {
    const editParam = searchParams.get('edit') === 'true';
    // Only allow editing if consultation exists and is not expired
    if (editParam && consultation) {
      const isExpired = new Date(consultation.expires_at) <= new Date();
      if (isExpired) {
        toast({
          title: 'Cannot Edit',
          description: 'This consultation has expired and cannot be modified.',
          variant: 'destructive',
        });
        // Remove edit parameter from URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('edit');
        navigate(`/consultation/${id}?${newSearchParams.toString()}`, { replace: true });
        setIsEditing(false);
      } else {
        setIsEditing(editParam);
      }
    } else {
      setIsEditing(editParam);
    }
  }, [searchParams, consultation, navigate, id, toast]);

  useEffect(() => {
    if (isEditing && consultation) {
      setEditedTitle(consultation.title);
      setEditedDescription(consultation.description);
    }
  }, [isEditing, consultation]);

  const fetchConsultation = async () => {
    try {
      const { data: consultationData, error } = await supabase
        .from('consultations')
        .select('id, title, description, category, expires_at, created_at, user_id')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Get profile data separately
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', consultationData.user_id)
        .single();

      if (profileError) {
        console.warn('Profile not found for user:', consultationData.user_id);
      }

      const consultation = {
        ...consultationData,
        profiles: profileData || { display_name: 'Unknown User' }
      };

      setConsultation(consultation);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load consultation',
        variant: 'destructive',
      });
      window.history.back();
    }
  };

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('id, content, created_at, user_id, sentimenttype, score, keyword')
        .eq('consultation_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // Get profile data for comment authors
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profilesData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profileError) {
        console.warn('Error fetching profiles:', profileError);
      }

      const profileMap = profilesData?.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      const commentIds = commentsData.map((c: any) => c.id);

      // Fetch likes for these comments to derive counts and whether current user liked
      let likesData: any[] = [];
      if (commentIds.length > 0) {
        const { data: ld, error: likesError } = await supabase
          .from('comment_likes')
          .select('comment_id, user_id')
          .in('comment_id', commentIds);

        if (likesError) {
          console.warn('Error fetching comment likes:', likesError);
        } else {
          likesData = ld || [];
        }
      }

      const likesCountMap = (likesData || []).reduce((acc: Record<string, number>, like) => {
        acc[like.comment_id] = (acc[like.comment_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const userLikedMap = (likesData || []).reduce((acc: Record<string, boolean>, like) => {
        if (user && like.user_id === user.id) acc[like.comment_id] = true;
        return acc;
      }, {} as Record<string, boolean>);

      const commentsWithProfiles = commentsData.map(comment => ({
        ...comment,
        profiles: profileMap[comment.user_id] || { display_name: 'Unknown User' },
        like_count: likesCountMap[comment.id] || 0,
        liked_by_user: !!userLikedMap[comment.id]
      }));

      setComments(commentsWithProfiles);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToComments = () => {
    const channel = supabase
      .channel('consultation-comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `consultation_id=eq.${id}`,
        },
        async (payload) => {
          // Fetch the complete comment with profile data
          const { data: commentData, error } = await supabase
            .from('comments')
            .select('id, content, created_at, user_id, sentimenttype, score, keyword')
            .eq('id', payload.new.id)
            .single();

          if (error || !commentData) return;

          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', commentData.user_id)
            .single();

          if (profileError) {
            console.warn('Profile not found for user:', commentData.user_id);
          }

          const commentWithProfile = {
            ...commentData,
            profiles: profileData || { display_name: 'Unknown User' }
          };

          setComments(prev => [...prev, commentWithProfile]);

          // If analysis fields are empty and it's our own comment, attempt to analyze now (fire-and-forget)
          if (!commentData.sentimenttype && commentData.content && commentData.user_id === user?.id) {
            import('@/integrations/analysis/commentAnalysisService')
              .then(m => m.analyzeAndUpdateComment(commentData.id, commentData.content))
              .catch(() => {/* ignore */});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const { data: inserted, error } = await supabase
        .from('comments')
        .insert({
          consultation_id: id!,
          content: newComment.trim(),
          user_id: user.id,
        })
        .select('id, content')
        .single();

      if (error) throw error;

      setNewComment('');
      toast({
        title: 'Success!',
        description: 'Your comment has been posted.',
      });

      // Fire-and-forget analysis call (does not block UI)
      if (inserted?.id && inserted?.content) {
        import('@/integrations/analysis/commentAnalysisService')
          .then(m => m.analyzeAndUpdateComment(inserted.id, inserted.content))
          .catch(() => {/* ignore */});
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!isOwner || isExpired) {
      if (isExpired) {
        toast({
          title: 'Cannot Edit',
          description: 'This consultation has expired and cannot be modified.',
          variant: 'destructive',
        });
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('consultations')
        .update({ title: editedTitle, description: editedDescription })
        .eq('id', consultation?.id);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Consultation updated successfully.',
      });

      setConsultation({ ...consultation, title: editedTitle, description: editedDescription });
      setIsEditing(false);
      
      // Remove edit parameter from URL after successful save
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('edit');
      const newUrl = newSearchParams.toString() ? 
        `/consultation/${id}?${newSearchParams.toString()}` : 
        `/consultation/${id}`;
      navigate(newUrl, { replace: true });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update consultation.',
        variant: 'destructive',
      });
    }
  };

  const handleExpire = async () => {
    if (!isOwner || !consultation) return;

    // Confirm with user before expiring
    const confirmed = window.confirm(
      'Are you sure you want to expire this consultation? This action cannot be undone and will prevent further comments.'
    );

    if (!confirmed) return;

    try {
      // Set expires_at to current time to immediately expire the consultation
      const { error } = await supabase
        .from('consultations')
        .update({ expires_at: new Date().toISOString() })
        .eq('id', consultation.id);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Consultation has been expired successfully.',
      });

      // Update local state
      setConsultation({ ...consultation, expires_at: new Date().toISOString() });
      
      // Optionally redirect to my consultations after a brief delay
      setTimeout(() => {
        navigate('/my-consultations');
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to expire consultation.',
        variant: 'destructive',
      });
    }
  };

  const startEditComment = (comment: Comment) => {
    if (user?.id !== comment.user_id || isExpired) {
      if (isExpired) {
        toast({
          title: 'Cannot Edit',
          description: 'This consultation has expired and comments cannot be modified.',
          variant: 'destructive',
        });
      }
      return;
    }
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const saveEditComment = async (commentId: string) => {
    if (!editingCommentContent.trim()) {
      toast({ title: 'Error', description: 'Comment cannot be empty', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: editingCommentContent.trim() })
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editingCommentContent.trim() } : c));
      toast({ title: 'Success', description: 'Comment updated.' });
      cancelEditComment();
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to update comment', variant: 'destructive' });
    }
  };

  const deleteComment = async (commentId: string) => {
    if (isExpired) {
      toast({
        title: 'Cannot Delete',
        description: 'This consultation has expired and comments cannot be modified.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
      toast({ title: 'Deleted', description: 'Comment removed.' });
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to delete comment', variant: 'destructive' });
    }
  };

  const toggleLike = async (commentId: string) => {
    // Require authenticated user
    if (!user) {
      toast({ title: 'Sign in required', description: 'You must be signed in to like comments.' });
      return;
    }

    // Ensure Supabase has a valid session attached to the request. If the
    // client lost its session (token expired or not persisted), RLS will block
    // the insert/delete with 42501. Check session here and prompt the user to
    // sign in if missing.
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Sign in required', description: 'Your session has expired, please sign in again.' });
        return;
      }
      // Optional: double-check the session user matches the app's user object
      if (session.user?.id !== user.id) {
        console.warn('Auth session user mismatch', session.user?.id, user.id);
      }
    } catch (e) {
      console.warn('Failed to get session before like toggle', e);
      toast({ title: 'Sign in required', description: 'Unable to confirm your session. Please sign in again.' });
      return;
    }

    // Prevent concurrent toggles on same comment
    const inFlightKey = `like-${commentId}`;
    // We'll attach a symbol in memory to indicate in-flight; simple guard
    const anyWin: any = window as any;
    if (anyWin[inFlightKey]) return;

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    // Optimistic update
    const wasLiked = !!comment.liked_by_user;
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, liked_by_user: !wasLiked, like_count: (c.like_count || 0) + (wasLiked ? -1 : 1) } : c));

    try {
      anyWin[inFlightKey] = true;

      if (wasLiked) {
        const { data: deletedRows, error } = await supabase
          .from('comment_likes')
          .delete()
          .match({ comment_id: commentId, user_id: user?.id })
          .select('*');

        if (error) throw error;

        // If nothing was deleted, maybe the row didn't exist or RLS prevented it.
        if (!deletedRows || deletedRows.length === 0) {
          console.warn('No like row deleted for', commentId, user?.id);
        }
      } else {
        const { data: insertedRows, error } = await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: user?.id })
          .select('*');

        // If another request inserted the same like concurrently, Postgres will
        // return a unique constraint violation (23505) or a message containing
        // 'duplicate key'. Treat that as a non-fatal condition because the
        // optimistic UI already marked the comment as liked.
        if (error) {
          const isDuplicate =
            (error?.code && String(error.code) === '23505') ||
            String(error?.message || error?.details || '').toLowerCase().includes('duplicate key');

          if (!isDuplicate) throw error;
        }

        // If insert succeeded but no rows returned, it may indicate RLS prevented
        // returning the inserted row; we'll log and reconcile below by fetching.
        if (!error && (!insertedRows || insertedRows.length === 0)) {
          console.warn('Insert returned no rows for comment_likes; possible RLS/permission issue', commentId, user?.id);
          toast({ title: 'Note', description: 'Like was sent to the server. If it disappears after refresh, check authentication or DB policies.', });
        }
      }
      // Re-fetch authoritative like info for this comment to ensure UI matches DB
      try {
        const { data: likesForComment, error: likesError } = await supabase
          .from('comment_likes')
          .select('user_id')
          .eq('comment_id', commentId);

        if (!likesError && Array.isArray(likesForComment)) {
          const likeCount = likesForComment.length;
          const likedByUser = likesForComment.some(l => l.user_id === user.id);
          setComments(prev => prev.map(c => c.id === commentId ? { ...c, like_count: likeCount, liked_by_user: likedByUser } : c));
        }
      } catch (fetchErr) {
        // ignore fetch errors here; UI will be reconciled on full refresh or realtime events
        console.warn('Failed to refresh likes for comment', commentId, fetchErr);
      }
    } catch (err: any) {
      // revert optimistic update
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, liked_by_user: wasLiked, like_count: (c.like_count || 0) + (wasLiked ? 0 : -1) } : c));
      console.error('Like toggle error:', err);
      // Show more details if available from Supabase
      const supaMsg = err?.message || err?.details || err?.hint || 'Unknown error';
      toast({ title: 'Like failed', description: `Failed to update like: ${supaMsg}`, variant: 'destructive' });
    } finally {
      anyWin[inFlightKey] = false;
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

  // Export CSV handler extracted from inline button. Tries server function first, falls back to client-side CSV.
  const handleExportCsv = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = (sessionData as any)?.session?.access_token;
      if (!token) {
        toast({ title: 'Sign in required', description: 'Please sign in to export comments.' });
        return;
      }

      const endpoint = import.meta.env.DEV
        ? `/functions/v1/get-comments-csv?consultation_id=${consultation?.id}`
        : `${SUPABASE_URL}/functions/v1/get-comments-csv?consultation_id=${consultation?.id}`;

      let resp: Response | null = null;
      try {
        resp = await fetch(endpoint, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
      } catch (networkErr) {
        resp = null;
      }

      if (resp && resp.ok) {
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `consultation-${consultation?.id}-comments.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast({ title: 'Export started', description: 'CSV is downloading.' });
        return;
      }

      if (!resp || resp.status === 404) {
        if (!comments || comments.length === 0) {
          toast({ title: 'No comments', description: 'There are no comments to export.' });
          return;
        }

        const headers = ['id', 'content', 'created_at', 'user_id', 'author_display_name'];
        const escape = (v: any) => {
          const s = v == null ? '' : String(v);
          const e = s.replace(/"/g, '""');
          return /[",\n\r]/.test(e) ? `"${e}"` : e;
        };

        const lines = [headers.join(',')];
        for (const c of comments) {
          const row = [
            escape(c.id),
            escape(c.content),
            escape(c.created_at),
            escape(c.user_id),
            escape(c.profiles?.display_name || ''),
          ];
          lines.push(row.join(','));
        }

        const csv = lines.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `consultation-${consultation?.id}-comments.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast({ title: 'Export started', description: 'CSV exported locally (client-side fallback).' });
        return;
      }

      let errBody: any = {};
      try { errBody = await resp.json(); } catch (e) { /* ignore */ }
      const message = errBody?.error || `Request failed with status ${resp?.status}`;
      throw new Error(message);
    } catch (err: any) {
      toast({ title: 'Export failed', description: err?.message || 'Failed to export comments', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!consultation) return null;

  const isExpired = new Date(consultation.expires_at) <= new Date();
  const isOwner = user?.id === consultation.user_id;
  const showEditButton = searchParams.get('edit') === 'true';

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span className="text-xs">Back</span>
        </Button>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-4">
          <div className="space-y-4">
            {isEditing ? (
              <>
                <input
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-md p-2 text-sm font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Consultation title"
                />
                <textarea
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-md p-2 min-h-28 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Describe your consultation..."
                />
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleEdit} size="sm" className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900">Save Changes</Button>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    {consultation.category.split(', ').map((cat, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-2 py-1">{cat}</Badge>
                    ))}
                    {isExpired && <Badge variant="destructive" className="text-xs px-2 py-1">Expired</Badge>}
                    {isOwner && <Badge variant="outline" className="text-xs px-2 py-1">Your Consultation</Badge>}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {getTimeLeft(consultation.expires_at)}
                  </div>
                </div>
                
                <CardTitle className="text-2xl font-bold leading-tight text-slate-900 dark:text-slate-100">
                  {consultation.title}
                </CardTitle>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
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
                  
                  <div className="flex gap-2">
                    {isOwner && showEditButton && !isExpired && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <Edit className="w-3 h-3 mr-1" />
                        <span className="text-xs">Edit</span>
                      </Button>
                    )}
                    {isOwner && !isExpired && (
                      <Button variant="outline" size="sm" onClick={handleExpire} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 border-red-300 dark:border-red-700">
                        <X className="w-3 h-3 mr-1" />
                        <span className="text-xs">Expire</span>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {!isEditing && (
            <div className="prose prose-sm max-w-none">
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">
                {consultation.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isOwner && (
        <div className="flex justify-end mt-3 mb-1">
          <Button variant="ghost" size="sm" onClick={handleExportCsv} className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            <span className="text-xs">Export CSV</span>
          </Button>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-lg font-bold flex items-center gap-3 text-slate-900 dark:text-slate-100">
            <MessageSquare className="w-5 h-5" />
            Comments ({comments.length})
          </h2>
        </div>

        {isExpired && (
          <Alert>
            <AlertDescription>
              This consultation has expired. No new comments can be added.
            </AlertDescription>
          </Alert>
        )}

        {!isExpired && user && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmitComment} className="space-y-4">
                <Textarea
                  placeholder="Share your thoughts, advice, or questions..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-24 resize-none text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  disabled={submitting}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={!newComment.trim() || submitting} size="sm" className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900">
                    {submitting ? <span className="text-xs">Posting...</span> : (
                      <>
                        <Send className="w-3 h-3 mr-1" />
                        <span className="text-xs">Post Comment</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {comments.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-base font-semibold mb-2 text-slate-900 dark:text-slate-100">No comments yet</h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-sm">
                  {isExpired 
                    ? "This consultation has expired and cannot receive new comments."
                    : "Be the first to share your thoughts and help with this consultation!"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            comments.map((comment, index) => (
              <div key={comment.id}>
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={comment.profiles?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {comment.profiles?.display_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                                {comment.profiles?.display_name}
                              </span>
                              {comment.user_id === consultation.user_id && (
                                <Badge variant="outline" className="text-xs">Author</Badge>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {isOwner && comment.sentimenttype && (
                            <Badge
                              variant="secondary"
                              className={
                                `text-[10px] px-2 py-0.5 border-0 ` +
                                (comment.sentimenttype?.toLowerCase() === 'positive'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                  : comment.sentimenttype?.toLowerCase() === 'negative'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')
                              }
                              title="Visible only to you as the consultation owner"
                            >
                              {String(comment.sentimenttype).charAt(0).toUpperCase() + String(comment.sentimenttype).slice(1)}
                            </Badge>
                          )}
                          <button 
                            className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors" 
                            onClick={() => toggleLike(comment.id)}
                          >
                            <Heart className={`w-4 h-4 ${comment.liked_by_user ? 'fill-destructive text-destructive' : ''}`} />
                            <span>{comment.like_count || 0}</span>
                          </button>

                          {user?.id === comment.user_id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => { if (!isExpired) startEditComment(comment); }}>
                                  {isExpired ? 'Edit (disabled - expired)' : 'Edit'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => { if (!isExpired) deleteComment(comment.id); }} className="text-destructive">
                                  {isExpired ? 'Delete (disabled - expired)' : 'Delete'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      
                      {editingCommentId === comment.id ? (
                        <div className="space-y-3 pl-13">
                          <Textarea
                            value={editingCommentContent}
                            onChange={(e) => setEditingCommentContent(e.target.value)}
                            className="min-h-20 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEditComment(comment.id)} className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-xs">Save</Button>
                            <Button size="sm" variant="outline" onClick={cancelEditComment} className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs">Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="pl-13">
                          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationDetail;