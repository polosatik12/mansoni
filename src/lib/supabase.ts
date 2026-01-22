// External Supabase client - connects to user's own Supabase project
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://rzvrehniremmozvhruvm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6dnJlaG5pcmVtbW96dmhydXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMTE2MTMsImV4cCI6MjA4NDY4NzYxM30.CppKbzWATca6eDBSvjyz4EUg54jjIEoqdntA3dsN23M";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };
