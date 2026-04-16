import { ClientBottomNav } from '@/components/layouts/ClientBottomNav';
import { ClientTopNav } from '@/components/layouts/ClientTopNav';
import { AuthGuard } from '@/components/providers/AuthGuard';
import { PushNotificationProvider } from '@/components/providers/PushNotificationProvider';
import { PWAInstallPrompt } from '@/components/shared/PWAInstallPrompt';

export const dynamic = 'force-dynamic';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['client', 'vendor', 'admin']}>
      <PushNotificationProvider>
        <div className="min-h-dvh w-full" style={{ background: 'var(--nafa-gray-100)', overflowX: 'hidden' }}>
          {/* iOS PWA: push content below the status bar on mobile.
              In browser mode safe-area-inset-top = 0, so this is invisible. */}
          <div className="nafa-safe-top-spacer md:hidden" aria-hidden="true" />
          {/* Top nav — desktop only */}
          <ClientTopNav />
          {/* Content */}
          <main className="pb-24 md:pb-0 md:pt-16">
            {children}
          </main>
          {/* Bottom nav — mobile only */}
          <ClientBottomNav />
          {/* PWA install guide */}
          <PWAInstallPrompt />
        </div>
      </PushNotificationProvider>
    </AuthGuard>
  );
}
