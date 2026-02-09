
-- Allow group owners to update member roles
CREATE POLICY "gcm_owner_update" ON public.group_chat_members
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.group_chats
    WHERE group_chats.id = group_chat_members.group_id
    AND group_chats.owner_id = auth.uid()
  )
);

-- Allow group owners to remove members
CREATE POLICY "gcm_owner_delete" ON public.group_chat_members
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.group_chats
    WHERE group_chats.id = group_chat_members.group_id
    AND group_chats.owner_id = auth.uid()
  )
);

-- Allow members to leave groups (delete their own membership)
CREATE POLICY "gcm_self_leave" ON public.group_chat_members
FOR DELETE USING (
  user_id = auth.uid()
);

-- Allow owners/admins to add new members
CREATE POLICY "gcm_admin_insert" ON public.group_chat_members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_chat_members existing
    WHERE existing.group_id = group_chat_members.group_id
    AND existing.user_id = auth.uid()
    AND existing.role IN ('owner', 'admin')
  )
);
