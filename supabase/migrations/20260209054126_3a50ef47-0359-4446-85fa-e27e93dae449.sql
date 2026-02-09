
-- Create message_reactions table
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Users can view reactions on messages in their conversations
CREATE POLICY "View reactions in own conversations"
ON public.message_reactions FOR SELECT
USING (
  message_id IN (
    SELECT m.id FROM messages m
    WHERE m.conversation_id IN (SELECT get_user_conversation_ids(auth.uid()))
  )
);

-- Users can add reactions to messages in their conversations
CREATE POLICY "Add reactions in own conversations"
ON public.message_reactions FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND message_id IN (
    SELECT m.id FROM messages m
    WHERE m.conversation_id IN (SELECT get_user_conversation_ids(auth.uid()))
  )
);

-- Users can remove their own reactions
CREATE POLICY "Remove own reactions"
ON public.message_reactions FOR DELETE
USING (user_id = auth.uid());

-- Index for fast lookup by message
CREATE INDEX idx_message_reactions_message_id ON public.message_reactions(message_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
