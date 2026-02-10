-- Add shared_story_id column to messages table
ALTER TABLE public.messages ADD COLUMN shared_story_id uuid REFERENCES public.stories(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_messages_shared_story_id ON public.messages(shared_story_id) WHERE shared_story_id IS NOT NULL;