import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
}

/** Suit la session de l'utilisateur connecté (prestataire ou administrateur). */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: Boolean(supabase),
    session: null,
    user: null,
    isAdmin: false,
  });

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    const apply = async (session: Session | null) => {
      let isAdmin = false;
      if (session?.user) {
        const { data } = await supabase!
          .from('admins')
          .select('user_id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        isAdmin = Boolean(data);
      }
      if (!cancelled) setState({ loading: false, session, user: session?.user ?? null, isAdmin });
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Laisser Supabase terminer son traitement avant de relancer une requête.
      setTimeout(() => apply(session), 0);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signOut() {
  await supabase?.auth.signOut();
}
