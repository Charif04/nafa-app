'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Truck, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency } from '@/lib/utils';
import { useVendorOrdersStore } from '@/stores/vendorOrdersStore';
import { useAuthStore } from '@/stores/authStore';
import type { OrderStatus } from '@/types';

const FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'Toutes', value: 'all' },
  { label: 'En attente', value: 'placed' },
  { label: 'Confirmées', value: 'confirmed' },
  { label: 'En préparation', value: 'preparing' },
  { label: 'Envoyées', value: 'in_transit_warehouse' },
  { label: 'Livrées', value: 'delivered' },
];

export default function VendorOrdersPage() {
  const user = useAuthStore((s) => s.user);
  const { orders, isLoading, error, fetchOrders, subscribeRealtime, unsubscribe } = useVendorOrdersStore();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    fetchOrders();
    if (user?.uid) subscribeRealtime(user.uid);
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const filtered = orders.filter((o) => filter === 'all' || o.orderStatus === filter);

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--nafa-black)' }}>Commandes reçues</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--nafa-gray-700)' }}>{orders.length} commandes</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: filter === f.value ? 'var(--nafa-orange)' : 'white',
              color: filter === f.value ? 'white' : 'var(--nafa-gray-700)',
              border: `1px solid ${filter === f.value ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)'}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium mb-4"
          style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--nafa-error)', border: '1px solid rgba(239,68,68,0.2)' }}>
          Erreur : {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border animate-pulse" style={{ borderColor: 'var(--nafa-gray-200)' }}>
              <div className="flex justify-between mb-3">
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
                  <div className="h-3 w-24 rounded animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
                </div>
                <div className="h-6 w-20 rounded-full animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
                <div className="h-3 w-3/4 rounded animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Aucune commande" description="Vous n'avez pas encore reçu de commandes." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((order, i) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}>
              <Link href={`/vendor/orders/${order.id}`} className="block">
                <div className="bg-white rounded-2xl p-5 border hover:shadow-md transition-shadow"
                  style={{ borderColor: 'var(--nafa-gray-200)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs nafa-mono font-semibold" style={{ color: 'var(--nafa-orange)' }}>
                        #{order.id.toUpperCase()}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }} suppressHydrationWarning>
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-base font-black nafa-mono" style={{ color: 'var(--nafa-black)' }}>
                          {formatCurrency(order.total, order.currency)}
                        </p>
                        <div className="mt-1">
                          <StatusBadge status={order.orderStatus} />
                        </div>
                      </div>
                      <ChevronRight size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)', flexShrink: 0 }} />
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    {order.items.map((item) => (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span style={{ color: 'var(--nafa-gray-700)' }}>{item.title} ×{item.quantity}</span>
                        <span className="nafa-mono font-medium" style={{ color: 'var(--nafa-black)' }}>
                          {formatCurrency(item.price * item.quantity, order.currency)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--nafa-gray-400)' }}>
                    <Truck size={12} strokeWidth={1.75} />
                    <span>{order.deliveryAddress.city}, {order.deliveryAddress.country}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
