
-- 1. Add unique constraint on story_views to prevent duplicate views
CREATE UNIQUE INDEX IF NOT EXISTS idx_story_views_unique_viewer 
ON public.story_views (story_id, viewer_id);

-- 2. Harden post_views RLS: only authenticated users can insert, must match their own user_id
DROP POLICY IF EXISTS "Anyone can record views" ON public.post_views;
CREATE POLICY "Authenticated users can record views"
ON public.post_views
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL));

-- 3. Harden reel_views RLS: only authenticated users can insert, must match their own user_id
DROP POLICY IF EXISTS "Anyone can record reel views" ON public.reel_views;
CREATE POLICY "Authenticated users can record reel views"
ON public.reel_views
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL));
