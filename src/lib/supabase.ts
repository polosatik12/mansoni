import { supabase as supabaseClient } from "@/integrations/supabase/client";

export const supabase = supabaseClient;

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
