'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore, mapToAppUser } from '@/stores/authStore';


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setLoading, setShopName } = useAuthStore();

  useEffect(() => {
    // Load initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (profile && supabaseUser) {
      setUser(mapToAppUser(supabaseUser, profile));

      // Load shop name for vendors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((profile as any).role === 'vendor') {
        const { data: vp } = await supabase
          .from('vendor_profiles')
          .select('shop_name')
          .eq('id', userId)
          .single();
        setShopName((vp as any)?.shop_name ?? null);
      } else {
        setShopName(null);
      }
    }
    setLoading(false);
  }

  return <>{children}</>;
}
