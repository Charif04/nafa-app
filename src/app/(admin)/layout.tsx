export const dynamic = 'force-dynamic';

import { AdminSidebar } from '@/components/layouts/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
      <AdminSidebar />
      <main className="lg:pl-64 pt-14 lg:pt-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
