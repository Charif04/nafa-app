'use client';
import {
  LayoutDashboard, Package, ShoppingBag, DollarSign,
  Wallet, Settings, LogOut, ChevronRight, Bell, BellDot
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

// Primary items shown in the mobile bottom nav
const BOTTOM_NAV = [
  { href: '/vendor/dashboard', icon: LayoutDashboard, label: 'Accueil' },
  { href: '/vendor/products', icon: Package, label: 'Produits' },
  { href: '/vendor/orders', icon: ShoppingBag, label: 'Commandes' },
  { href: '/vendor/revenue', icon: DollarSign, label: 'Revenus' },
  { href: '/vendor/wallet', icon: Wallet, label: 'Portefeuille' },
  { href: '/vendor/settings', icon: Settings, label: 'Paramètres' },
];

export function VendorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const storeShopName = useAuthStore((s) => s.shopName);
  const shopName = storeShopName ?? (`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Ma boutique');
  const initial = shopName[0]?.toUpperCase() ?? '?';
  const unreadCount = useNotificationStore((s) => s.getUnreadCount());

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
            <Logo size="sm" />
            <p className="text-xs mt-1 text-white/60">Espace Vendeur</p>
          </div>
          <nav className="flex-1 py-4 overflow-y-auto" aria-label="Navigation vendeur">
            {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
              const isActive = pathname.startsWith(href);
              const showBadge = badge && unreadCount > 0;
              return (
                <Link key={href} href={href}
                  className={cn('flex items-center gap-3 px-5 py-3 mx-2 rounded-xl transition-all mb-0.5',
                    isActive ? '' : 'text-white/60 hover:text-white hover:bg-white/8')}
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
      </aside>

      {/* ── Mobile: dark top bar (title only) ── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-end px-4 pb-2"
        style={{ background: 'var(--nafa-dark)', height: 'calc(env(safe-area-inset-top, 0px) + 52px)' }}
      >
        <span className="text-white font-semibold text-sm truncate flex-1">{shopName}</span>
        <Link href="/vendor/notifications" className="relative ml-2 p-1">
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
        aria-label="Navigation mobile vendeur"
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
              {/* Always rendered — CSS transition avoids layoutId flicker */}
              <div
                className="absolute top-0 rounded-full"
                style={{
                  left: '50%',
                  width: 24,
                  height: 3,
                  background: 'var(--nafa-orange)',
                  borderRadius: 99,
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
      </nav>
    </>
  );
}
