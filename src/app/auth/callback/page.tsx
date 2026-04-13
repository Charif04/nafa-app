'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Logo } from '@/components/shared/Logo';

// This page handles post-OAuth redirects (Google, etc.).
// The Supabase client automatically detects the code in the URL
// and exchanges it for a session (detectSessionInUrl is on by default).
// AuthProvider's onAuthStateChange listener then loads the profile.
// Once isLoading is false, we redirect based on role.

export default function AuthCallbackPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      if (user.role === 'admin') router.replace('/admin/dashboard');
      else if (user.role === 'vendor') router.replace('/vendor/dashboard');
      else router.replace('/home');
    } else {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6"
      style={{ background: 'var(--nafa-white)' }}>
      <Logo size="sm" />
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-[3px] border-t-transparent animate-spin"
          style={{ borderColor: 'var(--nafa-orange)', borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>Connexion en cours…</p>
      </div>
    </div>
  );
}
