'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronRight, Trash2, CheckSquare, Square, X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatOrderId } from '@/lib/utils';
import { useAdminOrdersStore } from '@/stores/adminOrdersStore';
import { supabase } from '@/lib/supabase';
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
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');

  // Select & delete state
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  const q = search.trim().toLowerCase();
  const filtered = orders.filter((o) => {
    const matchStatus = activeFilter === 'all' || o.orderStatus === activeFilter;
    const matchSearch = !q
      || formatOrderId(o.id).toLowerCase().includes(q)
      || o.id.toLowerCase().includes(q)
      || (o.clientName ?? '').toLowerCase().includes(q)
      || (o.vendorName ?? '').toLowerCase().includes(q)
      || o.items.some((it) => it.title.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((o) => o.id)));
    }
  };

  const cancelSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  async function handleDelete() {
    setIsDeleting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const ids = [...selected];
    // Delete related records first (in case DB has no cascade)
    await db.from('order_status_history').delete().in('order_id', ids);
    await db.from('order_items').delete().in('order_id', ids);
    await db.from('orders').delete().in('id', ids);
    await fetchOrders();
    setSelected(new Set());
    setSelectMode(false);
    setShowDeleteConfirm(false);
    setIsDeleting(false);
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--nafa-black)' }}>Commandes</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--nafa-gray-700)' }}>{filtered.length} / {orders.length} commandes</p>
        </div>
        {!selectMode ? (
          <button
            onClick={() => setSelectMode(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors"
            style={{ borderColor: 'var(--nafa-gray-200)', color: 'var(--nafa-gray-700)', background: 'white' }}>
            <CheckSquare size={14} strokeWidth={1.75} />
            Sélectionner
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={toggleSelectAll}
              className="px-3 py-2 rounded-xl text-xs font-medium border"
              style={{ borderColor: 'var(--nafa-gray-200)', color: 'var(--nafa-gray-700)', background: 'white' }}>
              {selected.size === filtered.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
            <button onClick={cancelSelectMode}
              className="w-8 h-8 rounded-xl flex items-center justify-center border"
              style={{ borderColor: 'var(--nafa-gray-200)', background: 'white' }}>
              <X size={14} strokeWidth={2} style={{ color: 'var(--nafa-gray-700)' }} />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 mb-6">
        <div className="relative max-w-sm">
          <Search size={16} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }} />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ID, client, vendeur ou produit…" aria-label="Rechercher une commande"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none bg-white"
            style={{ borderColor: 'var(--nafa-gray-200)' }} />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 w-full">
          <Filter size={14} strokeWidth={1.75} className="flex-shrink-0" style={{ color: 'var(--nafa-gray-400)' }} />
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setActiveFilter(f.value)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{ background: activeFilter === f.value ? 'var(--nafa-orange)' : 'white', color: activeFilter === f.value ? 'white' : 'var(--nafa-gray-700)', border: `1px solid ${activeFilter === f.value ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)'}` }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--nafa-gray-200)' }}>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr style={{ background: 'var(--nafa-gray-100)', borderBottom: '1px solid var(--nafa-gray-200)' }}>
                {selectMode && <th className="px-4 py-3 w-10" />}
                {['ID', 'Client', 'Vendeur', 'Montant', 'Paiement', 'Statut', 'Date', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => {
                const isSelected = selected.has(order.id);
                return (
                  <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    onClick={selectMode ? () => toggleSelect(order.id) : undefined}
                    style={{
                      borderBottom: '1px solid var(--nafa-gray-100)',
                      background: isSelected ? 'rgba(255,107,44,0.04)' : undefined,
                      cursor: selectMode ? 'pointer' : undefined,
                    }}>
                    {selectMode && (
                      <td className="px-4 py-3">
                        <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors"
                          style={{ borderColor: isSelected ? 'var(--nafa-orange)' : 'var(--nafa-gray-400)', background: isSelected ? 'var(--nafa-orange)' : 'transparent' }}>
                          {isSelected && <span style={{ color: 'white', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                        </div>
                      </td>
                    )}
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
                      {!selectMode && (
                        <Link href={`/admin/orders/${order.id}`}>
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }} aria-label="Voir les détails">
                            <ChevronRight size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />
                          </button>
                        </Link>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y" style={{ borderColor: 'var(--nafa-gray-100)' }}>
          {filtered.map((order, i) => {
            const isSelected = selected.has(order.id);
            return (
              <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                onClick={selectMode ? () => toggleSelect(order.id) : undefined}
                className="p-4 flex flex-col gap-2"
                style={{ background: isSelected ? 'rgba(255,107,44,0.04)' : undefined, cursor: selectMode ? 'pointer' : undefined }}>
                <div className="flex items-center justify-between">
                  {selectMode && (
                    <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center mr-2 flex-shrink-0 transition-colors"
                      style={{ borderColor: isSelected ? 'var(--nafa-orange)' : 'var(--nafa-gray-400)', background: isSelected ? 'var(--nafa-orange)' : 'transparent' }}>
                      {isSelected && <span style={{ color: 'white', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                    </div>
                  )}
                  <span className="text-xs font-semibold nafa-mono flex-1" style={{ color: 'var(--nafa-orange)' }}>{formatOrderId(order.id)}</span>
                  <StatusBadge status={order.orderStatus} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>{order.clientName}</span>
                  <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>{order.vendorName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold nafa-mono" style={{ color: 'var(--nafa-black)' }}>{formatCurrency(order.total, order.currency)}</span>
                  {!selectMode && (
                    <Link href={`/admin/orders/${order.id}`} className="text-xs font-semibold" style={{ color: 'var(--nafa-orange)' }}>Détails →</Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>Aucune commande trouvée</p>
          </div>
        )}
      </div>

      {/* Floating action bar */}
      <AnimatePresence>
        {selectMode && selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl"
            style={{ background: 'var(--nafa-black)', minWidth: 260 }}>
            <span className="text-sm font-semibold text-white flex-1">
              {selected.size} commande{selected.size > 1 ? 's' : ''} sélectionnée{selected.size > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'var(--nafa-error)', color: 'white' }}>
              <Trash2 size={13} strokeWidth={2} />
              Supprimer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => !isDeleting && setShowDeleteConfirm(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(255,23,68,0.08)' }}>
                <AlertTriangle size={22} strokeWidth={1.75} style={{ color: 'var(--nafa-error)' }} />
              </div>
              <h3 className="text-lg font-bold text-center mb-2" style={{ color: 'var(--nafa-black)' }}>
                Supprimer {selected.size} commande{selected.size > 1 ? 's' : ''} ?
              </h3>
              <p className="text-sm text-center mb-6" style={{ color: 'var(--nafa-gray-700)' }}>
                Cette action est irréversible. Les commandes et leur historique seront définitivement supprimés.
              </p>
              <div className="flex gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border"
                  style={{ borderColor: 'var(--nafa-gray-200)', color: 'var(--nafa-gray-700)' }}>
                  Annuler
                </button>
                <button
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: 'var(--nafa-error)' }}>
                  {isDeleting
                    ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    : <><Trash2 size={14} strokeWidth={2} />Supprimer</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom padding for floating bar */}
      {selectMode && selected.size > 0 && <div className="h-24" />}
    </div>
  );
}
