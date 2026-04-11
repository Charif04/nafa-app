export const dynamic = 'force-dynamic';

import { AdminSidebar } from '@/components/layouts/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
