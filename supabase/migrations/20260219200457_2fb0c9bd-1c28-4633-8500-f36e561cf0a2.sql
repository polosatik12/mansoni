
-- 1. Create is_group_admin SECURITY DEFINER function to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_id = _group_id
      AND user_id = _user_id
      AND role IN ('owner', 'admin')
  )
$$;

-- 2. Drop conflicting/broken INSERT policies
DROP POLICY IF EXISTS gcm_can_add_members ON public.group_chat_members;
DROP POLICY IF EXISTS gcm_insert_owner ON public.group_chat_members;

-- 3. Create clean INSERT policy using the new security definer function
CREATE POLICY gcm_can_add_members ON public.group_chat_members
FOR INSERT
WITH CHECK (
  is_group_admin(group_chat_members.group_id, auth.uid())
);
