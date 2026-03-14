"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { User, Session, SupabaseClient } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured] = useState(isSupabaseConfigured);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  if (configured && !supabaseRef.current) {
    supabaseRef.current = createClient();
  }

  useEffect(() => {
    const sb = supabaseRef.current;
    if (!sb) {
      setLoading(false);
      return;
    }

    sb.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(
    async (email: string, password: string) => {
      const sb = supabaseRef.current;
      if (!sb) return { error: { message: "Supabase non configuré" } };
      const { error } = await sb.auth.signUp({ email, password });
      return { error };
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const sb = supabaseRef.current;
      if (!sb) return { error: { message: "Supabase non configuré" } };
      const { error } = await sb.auth.signInWithPassword({ email, password });
      return { error };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabaseRef.current?.auth.signOut();
  }, []);

  return { user, session, loading, configured, signUp, signIn, signOut };
}
