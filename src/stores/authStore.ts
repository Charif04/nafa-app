import { create } from 'zustand';
import type { User as AppUser, UserRole } from '@/types';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthStore {
  user: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  shopName: string | null;   // vendor only
  setUser: (user: AppUser | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setShopName: (name: string | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  shopName: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  setShopName: (shopName) => set({ shopName }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, shopName: null });
  },
}));

// Map Supabase user + profile row → AppUser
export function mapToAppUser(
  supabaseUser: SupabaseUser,
  profile: {
    role: UserRole;
    first_name: string;
    last_name: string;
    phone: string | null;
    country: string;
    region: string | null;
    language: string;
    currency: string;
    avatar_url: string | null;
    created_at: string;
  }
): AppUser {
  return {
    uid: supabaseUser.id,
    role: profile.role,
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: supabaseUser.email ?? '',
    phone: profile.phone ?? '',
    country: profile.country,
    region: profile.region ?? '',
    language: profile.language as AppUser['language'],
    currency: profile.currency as AppUser['currency'],
    avatarUrl: profile.avatar_url ?? undefined,
    createdAt: profile.created_at,
    followers: 0,
    following: [],
  };
}
