'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Tag, PackageCheck, MessageSquare, Info, BellOff, X } from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Notification } from '@/types';

const NOTIF_CONFIG = {
  order_update: { icon: PackageCheck, color: 'bg-green-100', iconColor: 'text-green-600', dot: 'bg-green-500' },
  promo: { icon: Tag, color: 'bg-orange-100', iconColor: 'text-orange-600', dot: 'bg-orange-500' },
  review: { icon: MessageSquare, color: 'bg-blue-100', iconColor: 'text-blue-600', dot: 'bg-blue-500' },
  system: { icon: Info, color: 'bg-gray-100', iconColor: 'text-gray-600', dot: 'bg-gray-400' },
};

const NOTIF_DETAILS: Record<string, {
  clientName?: string;
  vendorName?: string;
  orderId?: string;
  amount?: number;
  status?: string;
  rating?: number;
  product?: string;
}> = {
  '1': { clientName: 'Fatou Ndiaye', orderId: 'NAFA-2024-00847', amount: 42500, status: 'Livré' },
  '2': { vendorName: 'NAFA Market', product: 'Toute la catégorie Mode' },
  '3': { vendorName: 'Boutique Aminata', orderId: 'NAFA-2024-00831', rating: 5, product: 'Boubou brodé' },
  '4': {},
};

export default function NotificationsPage() {
  const { notifications, markRead, markAllRead, getUnreadCount, fetchNotifications, subscribeRealtime, unsubscribe } = useNotificationStore();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  useEffect(() => {
    fetchNotifications();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) subscribeRealtime(user.id);
    });
    return () => unsubscribe();
  }, []);

  const unreadCount = getUnreadCount();

  const grouped = {
    today: notifications.filter((n) => Date.now() - new Date(n.createdAt).getTime() < 86400000),
    yesterday: notifications.filter((n) => {
      const diff = Date.now() - new Date(n.createdAt).getTime();
      return diff >= 86400000 && diff < 172800000;
    }),
    older: notifications.filter((n) => Date.now() - new Date(n.createdAt).getTime() >= 172800000),
  };

  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-white)' }}>
      <div className="max-w-2xl mx-auto px-4 md:px-6">
      {/* Header */}
      <header className="pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--nafa-black)' }}>Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium px-3 py-1.5 rounded-full"
                style={{ color: 'var(--nafa-orange)', background: 'rgba(255,107,44,0.08)' }}
              >
                Tout lire
              </button>
            )}
            <button
              onClick={() => setNotifEnabled(!notifEnabled)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
              style={{
                borderColor: notifEnabled ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)',
                color: notifEnabled ? 'var(--nafa-orange)' : 'var(--nafa-gray-700)',
              }}
              aria-label={notifEnabled ? 'Désactiver les notifications' : 'Activer les notifications'}
            >
              {notifEnabled ? <Bell size={13} strokeWidth={1.75} /> : <BellOff size={13} strokeWidth={1.75} />}
              {notifEnabled ? 'Activées' : 'Désactivées'}
            </button>
          </div>
        </div>
      </header>

      {/* Notification groups */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([groupKey, groupNotifs]) => {
          if (groupNotifs.length === 0) return null;
          const groupLabel = groupKey === 'today' ? 'Aujourd\'hui' : groupKey === 'yesterday' ? 'Hier' : 'Plus tôt';

          return (
            <div key={groupKey}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--nafa-gray-400)' }}>
                {groupLabel}
              </p>
              <div className="space-y-2">
                <AnimatePresence>
                  {groupNotifs.map((notif, i) => {
                    const config = NOTIF_CONFIG[notif.type];
                    const Icon = config.icon;

                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.3 }}
                        onClick={() => { markRead(notif.id); setSelectedNotif(notif); }}
                        className="flex items-start gap-3 p-3 rounded-2xl cursor-pointer transition-colors"
                        style={{ background: notif.isRead ? 'transparent' : 'rgba(255,107,44,0.04)', border: notif.isRead ? 'none' : '1px solid rgba(255,107,44,0.08)' }}
                        role="button"
                        tabIndex={0}
                        aria-label={notif.title}
                      >
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                          <Icon size={18} strokeWidth={1.75} className={config.iconColor} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--nafa-black)' }}>
                              {notif.title}
                            </p>
                            {!notif.isRead && (
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${config.dot}`} />
                            )}
                          </div>
                          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--nafa-gray-700)' }}>
                            {notif.body}
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--nafa-gray-400)' }}>
                            {formatRelativeTime(notif.createdAt)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* Notification detail modal */}
      <AnimatePresence>
        {selectedNotif && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.4)' }}
              onClick={() => setSelectedNotif(null)}
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 max-w-2xl mx-auto"
              style={{ boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--nafa-gray-200)' }} />

              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const config = NOTIF_CONFIG[selectedNotif.type];
                    const Icon = config.icon;
                    return (
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                        <Icon size={18} strokeWidth={1.75} className={config.iconColor} />
                      </div>
                    );
                  })()}
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>{selectedNotif.title}</p>
                    <p className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>{formatRelativeTime(selectedNotif.createdAt)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedNotif(null)} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--nafa-gray-100)' }}>
                  <X size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />
                </button>
              </div>

              {/* Body */}
              <p className="text-sm mb-5" style={{ color: 'var(--nafa-gray-700)' }}>{selectedNotif.body}</p>

              {/* Details */}
              {(() => {
                const details = NOTIF_DETAILS[selectedNotif.id];
                if (!details || Object.keys(details).length === 0) return null;
                return (
                  <div className="rounded-2xl p-4 space-y-2.5 mb-5" style={{ background: 'var(--nafa-gray-100)' }}>
                    {details.clientName && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--nafa-gray-700)' }}>Client</span>
                        <span className="font-semibold" style={{ color: 'var(--nafa-black)' }}>{details.clientName}</span>
                      </div>
                    )}
                    {details.vendorName && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--nafa-gray-700)' }}>Vendeur</span>
                        <span className="font-semibold" style={{ color: 'var(--nafa-black)' }}>{details.vendorName}</span>
                      </div>
                    )}
                    {details.orderId && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--nafa-gray-700)' }}>Commande</span>
                        <span className="font-semibold nafa-mono" style={{ color: 'var(--nafa-orange)' }}>#{details.orderId}</span>
                      </div>
                    )}
                    {details.product && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--nafa-gray-700)' }}>Produit / Catégorie</span>
                        <span className="font-semibold" style={{ color: 'var(--nafa-black)' }}>{details.product}</span>
                      </div>
                    )}
                    {details.amount && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--nafa-gray-700)' }}>Montant</span>
                        <span className="font-semibold nafa-mono" style={{ color: 'var(--nafa-black)' }}>{details.amount.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                    )}
                    {details.status && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--nafa-gray-700)' }}>Statut</span>
                        <span className="font-semibold text-green-600">{details.status}</span>
                      </div>
                    )}
                    {details.rating && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--nafa-gray-700)' }}>Note</span>
                        <span className="font-semibold" style={{ color: 'var(--nafa-orange)' }}>{'★'.repeat(details.rating)} {details.rating}/5</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* CTA */}
              {selectedNotif.type === 'order_update' && NOTIF_DETAILS[selectedNotif.id]?.orderId && (
                <Link
                  href={`/profile/orders`}
                  onClick={() => setSelectedNotif(null)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold text-white"
                  style={{ background: 'var(--nafa-orange)' }}
                >
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
