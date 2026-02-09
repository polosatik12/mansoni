
-- Create table for tracking unique channel message views
CREATE TABLE IF NOT EXISTS public.message_views (
  message_id uuid NOT NULL REFERENCES public.channel_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.message_views ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can record a view (upsert-safe)
CREATE POLICY "Users can record views"
ON public.message_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Anyone can read view counts (needed for displaying counts)
CREATE POLICY "Anyone can read message views"
ON public.message_views
FOR SELECT
USING (true);

-- Add index for fast count queries
CREATE INDEX idx_message_views_message_id ON public.message_views (message_id);

-- Enable realtime for view count updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_views;
