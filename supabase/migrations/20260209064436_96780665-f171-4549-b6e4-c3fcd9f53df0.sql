
-- Add edited_at column to track edited messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone DEFAULT NULL;

-- Allow users to DELETE their own messages (for "delete for everyone")
CREATE POLICY "Users can delete own messages"
ON public.messages
FOR DELETE
USING (sender_id = auth.uid());

-- Allow users to UPDATE their own messages (for editing content)
CREATE POLICY "Users can edit own messages"
ON public.messages
FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Drop the old restrictive update policy that only allows marking read
DROP POLICY IF EXISTS "Participants can mark incoming messages read" ON public.messages;

-- Re-create a combined update policy: edit own messages OR mark others' as read
CREATE POLICY "Update own or mark read"
ON public.messages
FOR UPDATE
USING (
  (sender_id = auth.uid()) OR
  (sender_id <> auth.uid() AND EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
  ))
);
