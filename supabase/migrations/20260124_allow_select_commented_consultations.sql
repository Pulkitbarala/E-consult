-- Allow users to view consultations they have commented on (including expired)
CREATE POLICY "Users can view consultations they commented on"
ON public.consultations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.comments c
    WHERE c.consultation_id = consultations.id
      AND c.user_id = auth.uid()
  )
);
