import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Ensure profile exists for the user
  const ensureProfile = async (authUser: User) => {
    const displayName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';
    try {
      await supabase
        .from("profiles")
        .upsert({ 
          user_id: authUser.id, 
          display_name: displayName 
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: true
        });
    } catch (e) {
      console.error("Error ensuring profile:", e);
    }
  };

  useEffect(() => {
    // Track the initial user ID to detect unexpected account switches
    let initialUserId: string | null = null;

    // FIRST check for existing session to set initialUserId
    supabase.auth.getSession().then(({ data: { session } }) => {
      initialUserId = session?.user?.id ?? null;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        ensureProfile(session.user);
      }
    });

    // Set up auth state listener AFTER initial session check
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Ignore TOKEN_REFRESHED events that don't change the user
        if (event === 'TOKEN_REFRESHED' && session?.user?.id === initialUserId) {
          setSession(session);
          return;
        }

        // If we had a user and now get a DIFFERENT user (account switch from another tab)
        // only update if it's a real sign-in/sign-out event
        if (
          initialUserId &&
          session?.user?.id &&
          session.user.id !== initialUserId &&
          event !== 'SIGNED_IN'
        ) {
          return; // ignore cross-tab account switches
        }

        initialUserId = session?.user?.id ?? null;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Ensure profile exists
        if (session?.user) {
          ensureProfile(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);


  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: displayName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });
    return { error: error as Error | null };
  };

  const verifyOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithPhone, verifyOtp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
