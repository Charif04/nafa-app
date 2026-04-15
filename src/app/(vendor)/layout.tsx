import { VendorSidebar } from '@/components/layouts/VendorSidebar';
import { AuthGuard } from '@/components/providers/AuthGuard';

export const dynamic = 'force-dynamic';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['vendor', 'admin']}>
      <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
        <VendorSidebar />
        <main className="lg:pl-64 pt-14 lg:pt-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
