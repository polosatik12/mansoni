
-- Drop the redundant "Users can edit own messages" policy since "Update own or mark read" already covers it
DROP POLICY IF EXISTS "Users can edit own messages" ON public.messages;
