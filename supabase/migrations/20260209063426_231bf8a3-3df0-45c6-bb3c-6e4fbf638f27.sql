-- Add forwarded_from (original sender display name) to all message tables
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS forwarded_from text DEFAULT NULL;
ALTER TABLE public.group_chat_messages ADD COLUMN IF NOT EXISTS forwarded_from text DEFAULT NULL;
ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS forwarded_from text DEFAULT NULL;