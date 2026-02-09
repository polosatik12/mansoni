
-- Allow channel admins to delete messages
CREATE POLICY "cm_admin_delete_msg" ON public.channel_messages
FOR DELETE USING (
  is_channel_admin(channel_id, auth.uid())
);
