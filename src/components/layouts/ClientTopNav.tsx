'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Bell, User, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/stores/cartStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { Logo } from '@/components/shared/Logo';

const NAV_ITEMS = [
  { href: '/home', icon: Home, label: 'Accueil' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/profile', icon: User, label: 'Profil' },
  { href: '/cart', icon: ShoppingCart, label: 'Panier' },
];

export function ClientTopNav() {
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const unreadCount = useNotificationStore((s) => s.getUnreadCount());

  return (
    <nav
      className="hidden md:flex fixed top-0 left-0 right-0 z-40 items-center justify-between px-6 lg:px-10 h-16"
      style={{ background: 'var(--nafa-white)', boxShadow: '0 1px 0 var(--nafa-gray-200)' }}
      role="navigation"
      aria-label="Navigation principale"
    >
      <Logo size="sm" />

      <div className="flex items-center gap-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          const isCart = href === '/cart';
          const isBell = href === '/notifications';

          return (
            <Link
              key={href}
              href={href}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: isActive ? 'rgba(255,107,44,0.08)' : 'transparent',
                color: isActive ? 'var(--nafa-orange)' : 'var(--nafa-gray-700)',
              }}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon size={18} strokeWidth={1.75} />
                {isBell && unreadCount > 0 && (
                  <AnimatePresence>
                    <motion.span
                      key="notif-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                      style={{ background: 'var(--nafa-error)' }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  </AnimatePresence>
                )}
                {isCart && totalItems > 0 && (
                  <AnimatePresence>
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                      style={{ background: 'var(--nafa-orange)' }}
                    >
                      {totalItems > 9 ? '9+' : totalItems}
                    </motion.span>
                  </AnimatePresence>
                )}
              </div>
              <span className="hidden lg:inline">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
