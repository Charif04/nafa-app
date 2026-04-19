'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShoppingBag, PackageCheck, X, AlertTriangle, BadgeCheck, Ban, Info, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notificationStore';

const FALLBACK = { icon: Info, color: 'bg-gray-100', iconColor: 'text-gray-500', dot: 'bg-gray-400' };
const CONFIG: Record<string, typeof FALLBACK> = {
  new_order:         { icon: ShoppingBag,   color: 'bg-orange-100', iconColor: 'text-orange-600', dot: 'bg-orange-500' },
  order_status:      { icon: PackageCheck,  color: 'bg-green-100',  iconColor: 'text-green-600',  dot: 'bg-green-500' },
  order_delivered:   { icon: PackageCheck,  color: 'bg-green-100',  iconColor: 'text-green-600',  dot: 'bg-green-500' },
  order_cancelled:   { icon: X,             color: 'bg-red-100',    iconColor: 'text-red-600',    dot: 'bg-red-500' },
  low_stock:         { icon: AlertTriangle, color: 'bg-yellow-100', iconColor: 'text-yellow-600', dot: 'bg-yellow-500' },
  account_verified:  { icon: BadgeCheck,    color: 'bg-blue-100',   iconColor: 'text-blue-600',   dot: 'bg-blue-500' },
  account_suspended: { icon: Ban,           color: 'bg-red-100',    iconColor: 'text-red-600',    dot: 'bg-red-500' },
  system:            { icon: Info,          color: 'bg-gray-100',   iconColor: 'text-gray-500',   dot: 'bg-gray-400' },
};

function cfg(type: string) { return CONFIG[type] ?? FALLBACK; }

export default function AdminNotificationsPage() {
  const { notifications, markRead, markAllRead, getUnreadCount, fetchNotifications, deleteNotification, deleteAllNotifications } = useNotificationStore();
  const [selected, setSelected] = useState<(typeof notifications)[0] | null>(null);
  const unreadCount = getUnreadCount();
  const now = Date.now();

  useEffect(() => { void fetchNotifications(); }, [fetchNotifications]);

  const grouped = {
    today:     notifications.filter((n) => now - new Date(n.createdAt).getTime() < 86400000),
    yesterday: notifications.filter((n) => { const d = now - new Date(n.createdAt).getTime(); return d >= 86400000 && d < 172800000; }),
    older:     notifications.filter((n) => now - new Date(n.createdAt).getTime() >= 172800000),
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--nafa-black)' }}>Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--nafa-gray-700)' }}>
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,107,44,0.1)', color: 'var(--nafa-orange)' }}>
              Tout lire
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={() => void deleteAllNotifications()}
              className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1"
              style={{ background: 'rgba(255,23,68,0.07)', color: 'var(--nafa-error)' }}>
              <Trash2 size={11} strokeWidth={2} />
              Tout supprimer
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([key, list]) => {
          if (!list.length) return null;
          const label = key === 'today' ? "Aujourd'hui" : key === 'yesterday' ? 'Hier' : 'Plus tôt';
          return (
            <div key={key}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--nafa-gray-400)' }}>{label}</p>
              <div className="space-y-2">
                {list.map((n, i) => {
                  const c = cfg(n.type);
                  const Icon = c.icon;
                  return (
                    <motion.div key={n.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      onClick={() => { markRead(n.id); setSelected(n); }}
                      className="flex items-start gap-3 p-3 rounded-2xl cursor-pointer bg-white"
                      style={{ border: `1px solid ${n.isRead ? 'var(--nafa-gray-200)' : 'rgba(255,107,44,0.12)'}`, background: n.isRead ? 'var(--nafa-white)' : 'rgba(255,107,44,0.04)' }}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${c.color}`}>
                        <Icon size={18} strokeWidth={1.75} className={c.iconColor} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold" style={{ color: 'var(--nafa-black)' }}>{n.title}</p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {!n.isRead && <span className={`w-2 h-2 rounded-full ${c.dot}`} />}
                            <button
                              onClick={(e) => { e.stopPropagation(); void deleteNotification(n.id); }}
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ background: 'var(--nafa-gray-100)' }}
                              aria-label="Supprimer">
                              <Trash2 size={11} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--nafa-gray-700)' }}>{n.body}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--nafa-gray-400)' }}>{formatRelativeTime(n.createdAt)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }}>
              <Bell size={24} strokeWidth={1.5} style={{ color: 'var(--nafa-gray-400)' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--nafa-gray-400)' }}>Aucune notification pour le moment</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40" onClick={() => setSelected(null)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 max-w-2xl mx-auto"
              style={{ boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--nafa-gray-200)' }} />
              <div className="flex items-start justify-between gap-3 mb-4">
                <p className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>{selected.title}</p>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--nafa-gray-100)' }}>
                  <X size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />
                </button>
              </div>
              <p className="text-sm mb-5" style={{ color: 'var(--nafa-gray-700)' }}>{selected.body}</p>
              {selected.linkedOrderId && (
                <Link href={`/admin/orders/${selected.linkedOrderId}`} onClick={() => setSelected(null)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold text-white"
                  style={{ background: 'var(--nafa-orange)' }}>
                  Voir la commande
                </Link>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
