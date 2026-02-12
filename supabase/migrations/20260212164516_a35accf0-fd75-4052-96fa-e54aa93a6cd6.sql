-- Create table for post mentions/tags
CREATE TABLE IF NOT EXISTS public.post_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  mentioned_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, mentioned_user_id)
);

-- Enable RLS
ALTER TABLE public.post_mentions ENABLE ROW LEVEL SECURITY;

-- Policy for viewing mentions
CREATE POLICY "Anyone can view post mentions"
ON public.post_mentions
FOR SELECT
USING (true);

-- Policy for creating mentions
CREATE POLICY "Post authors can create mentions"
ON public.post_mentions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_mentions.post_id
    AND posts.author_id = auth.uid()
  )
);

-- Policy for deleting mentions
CREATE POLICY "Post authors can delete mentions"
ON public.post_mentions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_mentions.post_id
    AND posts.author_id = auth.uid()
  )
);

-- Create trigger for mention notifications
CREATE OR REPLACE FUNCTION public.handle_post_mention_notification()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id UUID;
    post_content TEXT;
BEGIN
    SELECT author_id, content INTO post_author_id, post_content FROM public.posts WHERE id = NEW.post_id;
    
    -- Don't notify author about their own mentions
    IF post_author_id IS NOT NULL AND post_author_id != NEW.mentioned_user_id THEN
        INSERT INTO public.notifications (user_id, type, actor_id, post_id)
        VALUES (NEW.mentioned_user_id, 'mention', post_author_id, NEW.post_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public' SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS post_mention_notification_trigger ON public.post_mentions;
CREATE TRIGGER post_mention_notification_trigger
AFTER INSERT ON public.post_mentions
FOR EACH ROW
EXECUTE FUNCTION public.handle_post_mention_notification();