'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore, mapToAppUser } from '@/stores/authStore';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setLoading, setShopName } = useAuthStore();

  useEffect(() => {
    // getSession() reads from localStorage — no network request, instant
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        void loadProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          void loadProfile(session.user);
        } else {
          setUser(null);
          setShopName(null);
          setLoading(false);
        }
      }
    );

    // When the user returns to the tab (mobile browser restoring the page),
    // re-check the session so stale auth state gets refreshed.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          if (!session) {
            setUser(null);
            setShopName(null);
            setLoading(false);
          }
        });
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile(supabaseUser: SupabaseUser) {
    // Use the user object from the session — avoids a round-trip to Supabase's
    // /auth/v1/user endpoint which can hang when the device just woke from sleep.
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (profile) {
        setUser(mapToAppUser(supabaseUser, profile));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((profile as any).role === 'vendor') {
          const { data: vp } = await supabase
            .from('vendor_profiles')
            .select('shop_name')
            .eq('id', supabaseUser.id)
            .single();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setShopName((vp as any)?.shop_name ?? null);
        } else {
          setShopName(null);
        }
      }
    } catch {
      // Network error or profile not found — clear loading state regardless
      // so pages don't stay blank forever
    } finally {
      setLoading(false);
    }
  }

  return <>{children}</>;
}
