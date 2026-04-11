export const dynamic = 'force-dynamic';

import { VendorSidebar } from '@/components/layouts/VendorSidebar';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
      <VendorSidebar />
      <main className="lg:pl-64 pt-14 lg:pt-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
