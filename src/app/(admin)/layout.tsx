import { AdminSidebar } from '@/components/layouts/AdminSidebar';
import { AuthGuard } from '@/components/providers/AuthGuard';

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
        <AdminSidebar />
        <main className="lg:pl-64 pt-14 lg:pt-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
