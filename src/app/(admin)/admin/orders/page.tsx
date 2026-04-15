'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatOrderId } from '@/lib/utils';
import { useAdminOrdersStore } from '@/stores/adminOrdersStore';
import type { OrderStatus } from '@/types';

const STATUS_FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'En attente', value: 'placed' },
  { label: 'Confirmée', value: 'confirmed' },
  { label: 'En préparation', value: 'preparing' },
  { label: 'En route', value: 'in_transit_warehouse' },
  { label: 'À l\'entrepôt', value: 'at_warehouse' },
  { label: 'En livraison', value: 'delivering' },
  { label: 'Livré', value: 'delivered' },
  { label: 'Annulé', value: 'cancelled' },
];

export default function AdminOrdersPage() {
  const { orders, isLoading, fetchOrders } = useAdminOrdersStore();
  const [search, setSearch] = useState('');

  useEffect(() => { fetchOrders(); }, []);
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');

  const filtered = orders.filter((o) => {
    const matchStatus = activeFilter === 'all' || o.orderStatus === activeFilter;
    const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) || (o.clientName?.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--nafa-black)' }}>Commandes</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--nafa-gray-700)' }}>{orders.length} commandes au total</p>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }} />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ID commande ou client..." aria-label="Rechercher une commande"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none bg-white"
            style={{ borderColor: 'var(--nafa-gray-200)' }} />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)', flexShrink: 0 }} />
          {STATUS_FILTERS.slice(0, 6).map((f) => (
            <button key={f.value} onClick={() => setActiveFilter(f.value)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{ background: activeFilter === f.value ? 'var(--nafa-orange)' : 'white', color: activeFilter === f.value ? 'white' : 'var(--nafa-gray-700)', border: `1px solid ${activeFilter === f.value ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)'}` }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--nafa-gray-200)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr style={{ background: 'var(--nafa-gray-100)', borderBottom: '1px solid var(--nafa-gray-200)' }}>
                {['ID', 'Client', 'Vendeur', 'Montant', 'Paiement', 'Statut', 'Date', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => (
                <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  style={{ borderBottom: '1px solid var(--nafa-gray-100)' }}>
                  <td className="px-4 py-3 text-xs nafa-mono font-semibold" style={{ color: 'var(--nafa-orange)' }}>{formatOrderId(order.id)}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>{order.clientName}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--nafa-gray-700)' }}>{order.vendorName}</td>
                  <td className="px-4 py-3 text-sm font-bold nafa-mono" style={{ color: 'var(--nafa-black)' }}>{formatCurrency(order.total, order.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : order.paymentStatus === 'failed' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {order.paymentStatus === 'paid' ? 'Payé' : order.paymentStatus === 'failed' ? 'Échoué' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={order.orderStatus} /></td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--nafa-gray-700)' }}>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`}>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }} aria-label="Voir les détails">
                        <ChevronRight size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />
                      </button>
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>Aucune commande trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
}
