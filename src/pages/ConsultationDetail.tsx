import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, User, MessageSquare, Send, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
}

const ConsultationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
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
    setIsEditing(searchParams.get('edit') === 'true');
  }, [searchParams]);

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
      navigate('/feed');
    }
  };

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('id, content, created_at, user_id')
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

      const commentsWithProfiles = commentsData.map(comment => ({
        ...comment,
        profiles: profileMap[comment.user_id] || { display_name: 'Unknown User' }
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
            .select('id, content, created_at, user_id')
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
      const { error } = await supabase
        .from('comments')
        .insert({
          consultation_id: id!,
          content: newComment.trim(),
          user_id: user.id,
        });

      if (error) throw error;

      setNewComment('');
      toast({
        title: 'Success!',
        description: 'Your comment has been posted.',
      });
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
    if (!isOwner) return;

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
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update consultation.',
        variant: 'destructive',
      });
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/feed')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feed
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              {isEditing ? (
                <>
                  <input
                    className="w-full border rounded p-2 mb-2"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                  />
                  <textarea
                    className="w-full border rounded p-2"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button onClick={handleEdit}>Save</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{consultation.category}</Badge>
                    {isExpired && <Badge variant="destructive">Expired</Badge>}
                    {isOwner && <Badge variant="outline">Your Consultation</Badge>}
                  </div>
                  <CardTitle className="text-2xl">{consultation.title}</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={consultation.profiles?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {consultation.profiles?.display_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{consultation.profiles?.display_name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDistanceToNow(new Date(consultation.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-2">
                      {getTimeLeft(consultation.expires_at)}
                    </div>
                    {isOwner && showEditButton && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isEditing && (
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {consultation.description}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
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
                  className="min-h-24"
                  disabled={submitting}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={!newComment.trim() || submitting}>
                    {submitting ? 'Posting...' : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Post Comment
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
            <Card className="text-center py-8">
              <CardContent>
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No comments yet</h3>
                <p className="text-muted-foreground">
                  {isExpired 
                    ? "This consultation has expired and cannot receive new comments."
                    : "Be the first to share your thoughts!"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            comments.map((comment, index) => (
              <div key={comment.id}>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.profiles?.avatar_url} />
                        <AvatarFallback className="text-sm">
                          {comment.profiles?.display_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {comment.profiles?.display_name}
                            </span>
                            {comment.user_id === consultation.user_id && (
                              <Badge variant="outline" className="text-xs">Author</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {index < comments.length - 1 && <div className="h-2" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationDetail;