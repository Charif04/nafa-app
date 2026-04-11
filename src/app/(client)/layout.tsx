export const dynamic = 'force-dynamic';

import { ClientBottomNav } from '@/components/layouts/ClientBottomNav';
import { ClientTopNav } from '@/components/layouts/ClientTopNav';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
      {/* Top nav — desktop only */}
      <ClientTopNav />
      {/* Content */}
      <main className="pb-20 md:pb-0 md:pt-16">
        {children}
      </main>
      {/* Bottom nav — mobile only */}
      <ClientBottomNav />
    </div>
  );
}
