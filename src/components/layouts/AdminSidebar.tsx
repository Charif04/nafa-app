'use client';
import {
  LayoutDashboard, Package, Users, CreditCard, AlertTriangle,
  BarChart3, Settings, LogOut, ChevronRight, Tag, Bell, BellDot,
  MoreHorizontal, X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/orders', icon: Package, label: 'Commandes' },
  { href: '/admin/vendors', icon: Users, label: 'Vendeurs' },
  { href: '/admin/categories', icon: Tag, label: 'Catégories' },
  { href: '/admin/payments', icon: CreditCard, label: 'Paiements' },
  { href: '/admin/alerts', icon: AlertTriangle, label: 'Alertes' },
  { href: '/admin/notifications', icon: Bell, label: 'Notifications', badge: true },
  { href: '/admin/analytics', icon: BarChart3, label: 'Graphiques' },
  { href: '/admin/settings', icon: Settings, label: 'Paramètres' },
];

// Primary 4 items + "Plus" button in mobile bottom nav
const BOTTOM_NAV = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Accueil' },
  { href: '/admin/orders', icon: Package, label: 'Commandes' },
  { href: '/admin/vendors', icon: Users, label: 'Vendeurs' },
  { href: '/admin/payments', icon: CreditCard, label: 'Paiements' },
];

// Items shown in the "Plus" sheet
const MORE_NAV = [
  { href: '/admin/categories', icon: Tag, label: 'Catégories' },
  { href: '/admin/alerts', icon: AlertTriangle, label: 'Alertes' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Graphiques' },
  { href: '/admin/settings', icon: Settings, label: 'Paramètres' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationStore((s) => s.getUnreadCount());
  const adminName = user ? `${user.firstName} ${user.lastName}`.trim() || 'Admin' : 'Admin';
  const adminEmail = user?.email ?? 'admin@nafa.market';
  const initial = adminName[0]?.toUpperCase() ?? 'A';
  const [showMore, setShowMore] = useState(false);

  // "Plus" is active if current page is in MORE_NAV
  const moreIsActive = MORE_NAV.some((item) => pathname.startsWith(item.href));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 z-40" style={{ background: 'var(--nafa-dark)' }}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <Logo size="sm" className="text-white" />
          </div>
          <nav className="flex-1 py-4 overflow-y-auto" aria-label="Navigation admin">
            {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
              const isActive = pathname.startsWith(href);
              const showBadge = badge && unreadCount > 0;
              return (
                <Link key={href} href={href}
                  className={cn('flex items-center gap-3 px-5 py-3 mx-2 rounded-xl transition-all mb-0.5',
                    isActive ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/8')}
                  style={isActive ? { background: 'rgba(255,107,44,0.25)', color: 'var(--nafa-orange-light)' } : {}}
                  aria-current={isActive ? 'page' : undefined}>
                  <div className="relative flex-shrink-0">
                    {showBadge ? <BellDot size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-orange-light)' }} /> : <Icon size={18} strokeWidth={1.75} />}
                    {showBadge && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center" style={{ background: 'var(--nafa-orange)' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                  {isActive && <ChevronRight size={14} strokeWidth={1.75} className="ml-auto opacity-60" />}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--nafa-orange)' }}>
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{adminName}</p>
                <p className="text-xs text-white/50 truncate">{adminEmail}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors w-full" aria-label="Se déconnecter">
              <LogOut size={14} strokeWidth={1.75} />
              Se déconnecter
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile: dark top bar ── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-end px-4 pb-2"
        style={{ background: 'var(--nafa-dark)', height: 'calc(env(safe-area-inset-top, 0px) + 52px)' }}
      >
        <span className="text-white font-semibold text-sm flex-1">Admin</span>
        <Link href="/admin/notifications" className="relative ml-2 p-1">
          <Bell size={18} strokeWidth={1.75} className="text-white/80" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: 'var(--nafa-orange)' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>

      {/* ── Mobile: bottom navigation bar ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex"
        style={{
          background: 'var(--nafa-dark)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        aria-label="Navigation mobile admin"
      >
        {BOTTOM_NAV.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 pt-3 pb-2 relative"
              style={{
                color: isActive ? 'var(--nafa-orange-light)' : 'rgba(255,255,255,0.45)',
                transition: 'color 0.18s ease',
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className="absolute top-0 rounded-full"
                style={{
                  left: '50%', width: 24, height: 3,
                  background: 'var(--nafa-orange)', borderRadius: 99,
                  transform: `translateX(-50%) scaleX(${isActive ? 1 : 0})`,
                  opacity: isActive ? 1 : 0,
                  transition: 'transform 0.2s ease, opacity 0.2s ease',
                }}
              />
              <Icon size={20} strokeWidth={isActive ? 2 : 1.75} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}

        {/* Plus button */}
        <button
          onClick={() => setShowMore(true)}
          className="flex-1 flex flex-col items-center gap-1 pt-3 pb-2 relative"
          style={{
            color: moreIsActive ? 'var(--nafa-orange-light)' : 'rgba(255,255,255,0.45)',
            transition: 'color 0.18s ease',
          }}
          aria-label="Plus d'options"
        >
          <div
            className="absolute top-0 rounded-full"
            style={{
              left: '50%', width: 24, height: 3,
              background: 'var(--nafa-orange)', borderRadius: 99,
              transform: `translateX(-50%) scaleX(${moreIsActive ? 1 : 0})`,
              opacity: moreIsActive ? 1 : 0,
              transition: 'transform 0.2s ease, opacity 0.2s ease',
            }}
          />
          <MoreHorizontal size={20} strokeWidth={moreIsActive ? 2 : 1.75} />
          <span className="text-[10px] font-medium leading-none">Plus</span>
        </button>
      </nav>

      {/* ── "Plus" menu sheet ── */}
      <AnimatePresence>
        {showMore && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-[60]"
              style={{ background: 'rgba(0,0,0,0.55)' }}
              onClick={() => setShowMore(false)}
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 420, damping: 38 }}
              className="lg:hidden fixed left-0 right-0 z-[61] rounded-t-3xl"
              style={{
                bottom: 'calc(env(safe-area-inset-bottom, 0px) + 60px)',
                background: 'var(--nafa-dark)',
                boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
              }}
            >
              {/* Handle */}
              <div className="flex justify-between items-center px-5 pt-4 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>Navigation</span>
                <button onClick={() => setShowMore(false)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <X size={14} strokeWidth={2} className="text-white/70" />
                </button>
              </div>
              <div className="px-3 pb-4 grid grid-cols-4 gap-1">
                {MORE_NAV.map(({ href, icon: Icon, label }) => {
                  const isActive = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setShowMore(false)}
                      className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-colors"
                      style={{
                        background: isActive ? 'rgba(255,107,44,0.2)' : 'rgba(255,255,255,0.05)',
                        color: isActive ? 'var(--nafa-orange-light)' : 'rgba(255,255,255,0.7)',
                      }}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon size={22} strokeWidth={isActive ? 2 : 1.75} />
                      <span className="text-[10px] font-medium text-center leading-tight">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
