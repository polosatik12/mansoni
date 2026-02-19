-- Fix member_count: sync all existing groups to actual count
UPDATE group_chats g
SET member_count = (
  SELECT COUNT(*) FROM group_chat_members m WHERE m.group_id = g.id
);

-- Create trigger that was missing
DROP TRIGGER IF EXISTS trg_update_group_member_count ON group_chat_members;
CREATE TRIGGER trg_update_group_member_count
AFTER INSERT OR DELETE ON group_chat_members
FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

-- Fix the INSERT policy for group members - allow admins/owners to add members
-- The existing policies are recursive, add a simpler one using the SECURITY DEFINER function
DROP POLICY IF EXISTS gcm_admin_insert ON group_chat_members;
DROP POLICY IF EXISTS gcm_insert_admin ON group_chat_members;

CREATE POLICY gcm_can_add_members ON group_chat_members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_chats
    WHERE group_chats.id = group_chat_members.group_id
    AND group_chats.owner_id = auth.uid()
  )
  OR
  is_group_member(group_chat_members.group_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM group_chat_members gcm2
      WHERE gcm2.group_id = group_chat_members.group_id
      AND gcm2.user_id = auth.uid()
      AND gcm2.role IN ('owner', 'admin')
    )
);