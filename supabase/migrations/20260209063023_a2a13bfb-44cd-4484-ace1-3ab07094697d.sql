-- Add pinned_message_id to conversations (DMs)
ALTER TABLE public.conversations
  ADD COLUMN pinned_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- Add pinned_message_id to channels
ALTER TABLE public.channels
  ADD COLUMN pinned_message_id uuid REFERENCES public.channel_messages(id) ON DELETE SET NULL;

-- Allow conversation participants to update pinned_message_id
CREATE POLICY "Participants can pin messages"
ON public.conversations
FOR UPDATE
USING (
  id IN (SELECT get_user_conversation_ids(auth.uid()))
)
WITH CHECK (
  id IN (SELECT get_user_conversation_ids(auth.uid()))
);

-- Channel admins can already update via channels_owner_update policy
-- but we need admin-level pinning too
CREATE POLICY "Channel admins can pin messages"
ON public.channels
FOR UPDATE
USING (
  is_channel_admin(id, auth.uid())
);