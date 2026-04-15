'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
  /** Role(s) allowed to access this section */
  allowedRoles: UserRole[];
  /** Where to redirect if role mismatch (defaults to /home or /login) */
  fallback?: string;
}

/**
 * Client-side auth + role guard.
 * Renders nothing while auth is loading, then redirects if not authorised.
 */
export function AuthGuard({ children, allowedRoles, fallback }: AuthGuardProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      // Wrong portal — redirect to the right one
      if (user.role === 'admin') router.replace('/admin/dashboard');
      else if (user.role === 'vendor') router.replace('/vendor/dashboard');
      else router.replace(fallback ?? '/home');
    }
  }, [user, isLoading, allowedRoles, fallback, router]);

  // Show nothing while checking auth or redirecting
  if (isLoading || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: 'var(--nafa-orange)', opacity: 0.4 }} />
          <p className="text-sm font-medium" style={{ color: 'var(--nafa-gray-400)' }}>Chargement…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
