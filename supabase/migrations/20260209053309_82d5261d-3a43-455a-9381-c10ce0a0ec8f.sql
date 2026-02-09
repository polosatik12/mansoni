
-- ============================================
-- FIX: Infinite recursion & buggy policies for group chats
-- ============================================

-- Step 1: Create a SECURITY DEFINER function to get user's group IDs
-- This bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_group_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT group_id FROM group_chat_members WHERE user_id = p_user_id;
$$;

-- Step 2: Drop ALL existing problematic policies on group_chat_members
DROP POLICY IF EXISTS "Members can view group members" ON public.group_chat_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.group_chat_members;
DROP POLICY IF EXISTS "Group owners can manage members" ON public.group_chat_members;
DROP POLICY IF EXISTS "Members can leave" ON public.group_chat_members;
DROP POLICY IF EXISTS "Owners and admins can add members" ON public.group_chat_members;
DROP POLICY IF EXISTS "Owners can delete members" ON public.group_chat_members;

-- Step 3: Drop ALL existing problematic policies on group_chat_messages
DROP POLICY IF EXISTS "Group members can send messages" ON public.group_chat_messages;
DROP POLICY IF EXISTS "Group members can view messages" ON public.group_chat_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.group_chat_messages;
DROP POLICY IF EXISTS "Members can view messages" ON public.group_chat_messages;

-- Step 4: Drop ALL existing problematic policies on group_chats
DROP POLICY IF EXISTS "Members can view groups" ON public.group_chats;
DROP POLICY IF EXISTS "Users can view their groups" ON public.group_chats;
DROP POLICY IF EXISTS "Auth users can create groups" ON public.group_chats;
DROP POLICY IF EXISTS "Owner can update group" ON public.group_chats;
DROP POLICY IF EXISTS "Owner can delete group" ON public.group_chats;

-- ============================================
-- RECREATE: Clean, non-recursive policies
-- ============================================

-- === group_chat_members ===

-- Users can see their own memberships (no recursion)
CREATE POLICY "gcm_select_own"
ON public.group_chat_members FOR SELECT
USING (user_id = auth.uid());

-- Users can see other members of their groups (uses SECURITY DEFINER function)
CREATE POLICY "gcm_select_group_members"
ON public.group_chat_members FOR SELECT
USING (group_id IN (SELECT get_user_group_ids(auth.uid())));

-- Group owners can add members
CREATE POLICY "gcm_insert_owner"
ON public.group_chat_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_chats 
    WHERE id = group_chat_members.group_id 
    AND owner_id = auth.uid()
  )
);

-- Admins can add members  
CREATE POLICY "gcm_insert_admin"
ON public.group_chat_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_chat_members gcm
    WHERE gcm.group_id = group_chat_members.group_id
    AND gcm.user_id = auth.uid()
    AND gcm.role IN ('owner', 'admin')
  )
);

-- Members can leave (delete own membership)
CREATE POLICY "gcm_delete_self"
ON public.group_chat_members FOR DELETE
USING (user_id = auth.uid());

-- Owners can remove members
CREATE POLICY "gcm_delete_owner"
ON public.group_chat_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM group_chats 
    WHERE id = group_chat_members.group_id 
    AND owner_id = auth.uid()
  )
);

-- === group_chats ===

-- Users can view groups they belong to (uses SECURITY DEFINER function)
CREATE POLICY "gc_select"
ON public.group_chats FOR SELECT
USING (
  owner_id = auth.uid() 
  OR id IN (SELECT get_user_group_ids(auth.uid()))
);

-- Authenticated users can create groups
CREATE POLICY "gc_insert"
ON public.group_chats FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Owners can update their groups
CREATE POLICY "gc_update"
ON public.group_chats FOR UPDATE
USING (owner_id = auth.uid());

-- Owners can delete their groups
CREATE POLICY "gc_delete"
ON public.group_chats FOR DELETE
USING (owner_id = auth.uid());

-- === group_chat_messages ===

-- Members can view messages (uses SECURITY DEFINER function)
CREATE POLICY "gcmsg_select"
ON public.group_chat_messages FOR SELECT
USING (group_id IN (SELECT get_user_group_ids(auth.uid())));

-- Members can send messages
CREATE POLICY "gcmsg_insert"
ON public.group_chat_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND group_id IN (SELECT get_user_group_ids(auth.uid()))
);
