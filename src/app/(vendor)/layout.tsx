import { VendorSidebar } from '@/components/layouts/VendorSidebar';
import { AuthGuard } from '@/components/providers/AuthGuard';
import { PushNotificationProvider } from '@/components/providers/PushNotificationProvider';
import { NotificationProvider } from '@/components/providers/NotificationProvider';

export const dynamic = 'force-dynamic';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['vendor', 'admin']}>
      <PushNotificationProvider>
        <NotificationProvider>
          <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
            <VendorSidebar />
            <main className="lg:pl-64 admin-vendor-main overflow-x-hidden">
              {children}
            </main>
          </div>
        </NotificationProvider>
      </PushNotificationProvider>
    </AuthGuard>
  );
}
