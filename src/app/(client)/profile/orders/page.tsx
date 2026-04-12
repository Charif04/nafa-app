'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Package, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { OrderCardSkeleton } from '@/components/shared/SkeletonShimmer';
import { formatCurrency } from '@/lib/utils';
import { useClientOrdersStore } from '@/stores/clientOrdersStore';

export default function OrdersPage() {
  const router = useRouter();
  const { orders, isLoading, fetchOrders } = useClientOrdersStore();

  useEffect(() => { fetchOrders(); }, []);

  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <header className="sticky top-0 md:top-16 z-10 flex items-center gap-3 py-4"
          style={{ background: 'var(--nafa-white)', borderBottom: '1px solid var(--nafa-gray-200)' }}>
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }} aria-label="Retour">
            <ChevronLeft size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-black)' }} />
          </button>
          <h1 className="text-lg font-bold" style={{ color: 'var(--nafa-black)' }}>Mes commandes</h1>
          <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}>
            {orders.length}
          </span>
        </header>

        <div className="py-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <OrderCardSkeleton key={i} />)}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState icon={Package} title="Aucune commande" description="Vous n'avez pas encore passé de commande."
              action={{ label: 'Explorer les produits', onClick: () => router.push('/home') }} />
          ) : (
            orders.map((order, i) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <Link href={`/profile/orders/${order.id}`} className="block bg-white rounded-2xl p-4 border hover:shadow-sm transition-shadow"
                  style={{ borderColor: 'var(--nafa-gray-200)' }}>
                  <div className="flex items-start gap-3">
                    {order.items[0]?.image ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={order.items[0].image} alt={order.items[0].title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--nafa-gray-100)' }}>
                        <Package size={22} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold nafa-mono" style={{ color: 'var(--nafa-orange)' }}>
                        #{order.id.toUpperCase()}
                      </p>
                      <p className="text-sm font-medium truncate mt-0.5" style={{ color: 'var(--nafa-black)' }}>
                        {order.items[0]?.title}{order.items.length > 1 ? ` +${order.items.length - 1} article${order.items.length > 2 ? 's' : ''}` : ''}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-700)' }}>
                        {order.vendorName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }} suppressHydrationWarning>
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <p className="text-sm font-bold nafa-mono" style={{ color: 'var(--nafa-black)' }}>
                        {formatCurrency(order.total, order.currency)}
                      </p>
                      <StatusBadge status={order.orderStatus} />
                    </div>
                    <ChevronRight size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)', alignSelf: 'center' }} />
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
