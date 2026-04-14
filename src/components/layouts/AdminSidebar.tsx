'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, Users, CreditCard, AlertTriangle,
  BarChart3, Settings, Menu, X, LogOut, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/orders', icon: Package, label: 'Commandes' },
  { href: '/admin/vendors', icon: Users, label: 'Vendeurs' },
  { href: '/admin/payments', icon: CreditCard, label: 'Paiements' },
  { href: '/admin/alerts', icon: AlertTriangle, label: 'Alertes' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Graphiques' },
  { href: '/admin/settings', icon: Settings, label: 'Paramètres' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const adminName = user ? `${user.firstName} ${user.lastName}`.trim() || 'Admin' : 'Admin';
  const adminEmail = user?.email ?? 'admin@nafa.market';
  const initial = adminName[0]?.toUpperCase() ?? 'A';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <Logo size="sm" className="text-white" />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto" aria-label="Navigation admin">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-5 py-3 mx-2 rounded-xl transition-all mb-0.5',
                isActive ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/8'
              )}
              style={isActive ? { background: 'rgba(255,107,44,0.25)', color: 'var(--nafa-orange-light)' } : {}}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span className="text-sm font-medium">{label}</span>
              {isActive && <ChevronRight size={14} strokeWidth={1.75} className="ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: admin user + logout */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'var(--nafa-orange)' }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{adminName}</p>
            <p className="text-xs text-white/50 truncate">{adminEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors w-full"
          aria-label="Se déconnecter"
        >
          <LogOut size={14} strokeWidth={1.75} />
          Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 z-40"
        style={{ background: 'var(--nafa-dark)' }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--nafa-dark)' }}
        aria-label="Ouvrir le menu"
      >
        <Menu size={18} strokeWidth={1.75} className="text-white" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col"
              style={{ background: 'var(--nafa-dark)' }}
            >
              <div className="absolute top-4 right-4">
                <button onClick={() => setMobileOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10" aria-label="Fermer">
                  <X size={16} strokeWidth={1.75} className="text-white" />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
