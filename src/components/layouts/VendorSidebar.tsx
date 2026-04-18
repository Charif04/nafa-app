'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, DollarSign,
  Wallet, Settings, Menu, X, LogOut, ChevronRight, Bell, BellDot
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/vendor/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/vendor/products', icon: Package, label: 'Mes produits' },
  { href: '/vendor/orders', icon: ShoppingBag, label: 'Commandes' },
  { href: '/vendor/revenue', icon: DollarSign, label: 'Revenus' },
  { href: '/vendor/wallet', icon: Wallet, label: 'Portefeuille' },
  { href: '/vendor/notifications', icon: Bell, label: 'Notifications', badge: true },
  { href: '/vendor/settings', icon: Settings, label: 'Paramètres' },
];

export function VendorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const storeShopName = useAuthStore((s) => s.shopName);
  const shopName = storeShopName ?? (`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Ma boutique');
  const initial = shopName[0]?.toUpperCase() ?? '?';
  const unreadCount = useNotificationStore((s) => s.getUnreadCount());

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <Logo size="sm" />
        <p className="text-xs mt-1 text-white/60">Espace Vendeur</p>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto" aria-label="Navigation vendeur">
        {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
          const isActive = pathname.startsWith(href);
          const showBadge = badge && unreadCount > 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-5 py-3 mx-2 rounded-xl transition-all mb-0.5',
                isActive ? '' : 'text-white/60 hover:text-white hover:bg-white/8'
              )}
              style={isActive ? { background: 'rgba(255,107,44,0.25)', color: 'var(--nafa-orange-light)' } : {}}
              aria-current={isActive ? 'page' : undefined}
            >
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
            <p className="text-xs font-semibold text-white truncate">{shopName}</p>
            <p className="text-xs text-white/50 truncate">{user?.email ?? ''}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors w-full" aria-label="Se déconnecter">
          <LogOut size={14} strokeWidth={1.75} />
          Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 z-40" style={{ background: 'var(--nafa-dark)' }}>
        {sidebarContent}
      </aside>

      {/* Mobile top bar — covers iOS status bar + provides hamburger */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-end px-4 pb-2"
        style={{ background: 'var(--nafa-dark)', height: 'calc(env(safe-area-inset-top, 0px) + 52px)' }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.1)' }}
          aria-label="Ouvrir le menu"
        >
          <Menu size={18} strokeWidth={1.75} className="text-white" />
        </button>
        <span className="ml-3 text-white font-semibold text-sm truncate flex-1">{shopName}</span>
        {unreadCount > 0 && (
          <div className="relative ml-auto">
            <Bell size={18} strokeWidth={1.75} className="text-white/80" />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: 'var(--nafa-orange)' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="lg:hidden fixed inset-0 z-40 bg-black/50" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 flex flex-col" style={{ background: 'var(--nafa-dark)' }}>
              <div className="absolute right-4" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
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
