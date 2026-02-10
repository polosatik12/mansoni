-- Fix story_views RLS: add UPDATE policy for upsert support
CREATE POLICY "Users can update their story views"
ON public.story_views
FOR UPDATE
USING (viewer_id = auth.uid());

-- Also add DELETE policy
CREATE POLICY "Users can delete their story views"
ON public.story_views
FOR DELETE
USING (viewer_id = auth.uid());