// Backwards-compatible wrapper.
// The app runs on Lovable Cloud; keep a single client everywhere to avoid split sessions.
import { supabase as lovableSupabase } from "@/integrations/supabase/client";

export const supabase = lovableSupabase;

// Kept for older imports; values come from the environment managed by Lovable Cloud.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
