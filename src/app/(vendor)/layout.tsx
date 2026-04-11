export const dynamic = 'force-dynamic';

import { VendorSidebar } from '@/components/layouts/VendorSidebar';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
      <VendorSidebar />
      <main className="flex-1 lg:ml-64 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
