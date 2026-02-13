ALTER TABLE public.reel_views 
ADD CONSTRAINT unique_user_reel_view UNIQUE (user_id, reel_id);