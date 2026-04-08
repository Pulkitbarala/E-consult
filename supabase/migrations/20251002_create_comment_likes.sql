-- Create comment_likes table to support liking comments
CREATE TABLE public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

-- Enable RLS on comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Policies for comment_likes
CREATE POLICY "Users can insert their own likes"
ON public.comment_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
ON public.comment_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Allow everyone to read comment likes so UI can display counts and whether
-- the current user liked a comment. RLS is enabled on the table so we must
-- explicitly permit SELECT.
CREATE POLICY "Comment likes are viewable by everyone"
ON public.comment_likes
FOR SELECT
USING (true);

-- Ensure comment_likes is available over realtime
ALTER TABLE public.comment_likes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;
