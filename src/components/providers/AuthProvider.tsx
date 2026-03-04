import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { LoginView } from '@/features/auth/LoginView/LoginView';

type AuthContextValue = {
  session: Session;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // undefined = still resolving, null = no session, Session = authenticated
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    // Fall back to login after 10 s if the token refresh times out or
    // the network is unreachable (avoids indefinite loading state).
    const fallbackTimer = setTimeout(() => {
      if (mounted && session === undefined) setSession(null);
    }, 10_000);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (mounted) { clearTimeout(fallbackTimer); setSession(session); }
      })
      .catch(() => {
        // AbortError from React Strict Mode double-invoke or network failure.
        // Fall through — fallbackTimer will trigger login view.
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) { clearTimeout(fallbackTimer); setSession(session); }
    });

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Still resolving — render dark shell to avoid off-white flash
  if (session === undefined) return <div style={{ height: '100dvh', background: '#282828' }} />;

  if (!session) return <LoginView />;

  return (
    <AuthContext.Provider value={{ session, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
