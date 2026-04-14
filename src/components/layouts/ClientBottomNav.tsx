'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Bell, User, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import { useNotificationStore } from '@/stores/notificationStore';

const NAV_ITEMS = [
  { href: '/home', icon: Home, label: 'Accueil' },
  { href: '/notifications', icon: Bell, label: 'Messages' },
  { href: '/profile', icon: User, label: 'Profil' },
  { href: '/cart', icon: ShoppingCart, label: 'Panier' },
];

export function ClientBottomNav() {
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const unreadCount = useNotificationStore((s) => s.getUnreadCount());

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 safe-area-pb"
      style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}
      role="navigation"
      aria-label="Navigation principale"
    >
      <div className="flex items-stretch max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          const isCart = href === '/cart';
          const isBell = href === '/notifications';

          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative min-h-[56px] transition-colors',
                isActive ? '' : 'opacity-60'
              )}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <motion.div
                  animate={{ scale: isActive ? 1.05 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Icon
                    size={22}
                    strokeWidth={1.75}
                    style={{ color: isActive ? 'var(--nafa-orange)' : 'var(--nafa-gray-700)' }}
                  />
                </motion.div>

                {/* Notification badge */}
                {isBell && unreadCount > 0 && (
                  <AnimatePresence>
                    <motion.span
                      key="notif-badge"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                      style={{ background: 'var(--nafa-error)' }}
                      aria-label={`${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  </AnimatePresence>
                )}

                {/* Cart badge */}
                {isCart && totalItems > 0 && (
                  <AnimatePresence>
                    <motion.span
                      key="badge"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                      style={{ background: 'var(--nafa-orange)' }}
                      aria-label={`${totalItems} article${totalItems > 1 ? 's' : ''} dans le panier`}
                    >
                      {totalItems > 9 ? '9+' : totalItems}
                    </motion.span>
                  </AnimatePresence>
                )}
              </div>

              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? 'var(--nafa-orange)' : 'var(--nafa-gray-700)' }}
              >
                {label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ background: 'var(--nafa-orange)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
