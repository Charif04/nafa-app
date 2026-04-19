'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Truck, ChevronRight, Search, X, EyeOff, Eye, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency, formatOrderId } from '@/lib/utils';
import { useVendorOrdersStore } from '@/stores/vendorOrdersStore';
import { useAuthStore } from '@/stores/authStore';
import type { OrderStatus } from '@/types';

const STORAGE_KEY = 'nafa_hidden_vendor_orders';

const FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'Toutes', value: 'all' },
  { label: 'En attente', value: 'placed' },
  { label: 'Confirmées', value: 'confirmed' },
  { label: 'En préparation', value: 'preparing' },
  { label: 'Envoyées', value: 'in_transit_warehouse' },
  { label: 'À l\'entrepôt', value: 'at_warehouse' },
  { label: 'En livraison', value: 'delivering' },
  { label: 'Livrées', value: 'delivered' },
  { label: 'Annulées', value: 'cancelled' },
];

export default function VendorOrdersPage() {
  const user = useAuthStore((s) => s.user);
  const { orders, isLoading, error, fetchOrders, subscribeRealtime, unsubscribe } = useVendorOrdersStore();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  // Hide / select state
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOrders();
    if (user?.uid) subscribeRealtime(user.uid);

    const onVisible = () => { if (document.visibilityState === 'visible') fetchOrders(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Load hidden IDs from localStorage (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHiddenIds(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  const persistHidden = (next: Set<string>) => {
    setHiddenIds(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch {}
  };

  const hideSelected = () => {
    const next = new Set([...hiddenIds, ...selected]);
    persistHidden(next);
    setSelected(new Set());
    setSelectMode(false);
  };

  const unhideOrder = (id: string) => {
    const next = new Set([...hiddenIds].filter((x) => x !== id));
    persistHidden(next);
  };

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const cancelSelectMode = () => { setSelectMode(false); setSelected(new Set()); };

  const q = search.trim().toLowerCase();

  // Visible orders (exclude hidden unless showHidden)
  const visibleOrders = orders.filter((o) => showHidden ? hiddenIds.has(o.id) : !hiddenIds.has(o.id));

  const filtered = visibleOrders.filter((o) => {
    const matchFilter = filter === 'all' || o.orderStatus === filter;
    const matchSearch = !q
      || formatOrderId(o.id).toLowerCase().includes(q)
      || o.items.some((it) => it.title.toLowerCase().includes(q))
      || (o.clientName ?? '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const hiddenCount = hiddenIds.size;

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--nafa-black)' }}>Commandes reçues</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--nafa-gray-700)' }}>{filtered.length} / {visibleOrders.length} commandes</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hiddenCount > 0 && !selectMode && (
            <button
              onClick={() => { setShowHidden((v) => !v); setSelected(new Set()); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors"
              style={{ borderColor: showHidden ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)', color: showHidden ? 'var(--nafa-orange)' : 'var(--nafa-gray-700)', background: showHidden ? 'rgba(255,107,44,0.06)' : 'white' }}>
              {showHidden ? <Eye size={13} strokeWidth={1.75} /> : <EyeOff size={13} strokeWidth={1.75} />}
              {showHidden ? 'Visibles' : `Masquées (${hiddenCount})`}
            </button>
          )}
          {!selectMode ? (
            <button
              onClick={() => setSelectMode(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors"
              style={{ borderColor: 'var(--nafa-gray-200)', color: 'var(--nafa-gray-700)', background: 'white' }}>
              <CheckSquare size={13} strokeWidth={1.75} />
              Sélectionner
            </button>
          ) : (
            <button onClick={cancelSelectMode}
              className="w-8 h-8 rounded-xl flex items-center justify-center border"
              style={{ borderColor: 'var(--nafa-gray-200)', background: 'white' }}>
              <X size={14} strokeWidth={2} style={{ color: 'var(--nafa-gray-700)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border mb-4 bg-white"
        style={{ borderColor: 'var(--nafa-gray-200)' }}>
        <Search size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par ID, produit ou client…"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--nafa-black)' }}
        />
        {search && (
          <button onClick={() => setSearch('')} aria-label="Effacer">
            <X size={13} strokeWidth={2} style={{ color: 'var(--nafa-gray-400)' }} />
          </button>
        )}
      </div>

      {/* Status filter chips */}
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

      {/* Hidden mode banner */}
      {showHidden && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(255,107,44,0.06)', border: '1px solid rgba(255,107,44,0.15)' }}>
          <EyeOff size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
          <p className="text-sm flex-1" style={{ color: 'var(--nafa-gray-700)' }}>
            Affichage des commandes masquées. Appuyez sur <strong>Visibles</strong> pour revenir.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border animate-pulse" style={{ borderColor: 'var(--nafa-gray-200)' }}>
              <div className="flex justify-between mb-3">
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded" style={{ background: 'var(--nafa-gray-200)' }} />
                  <div className="h-3 w-24 rounded" style={{ background: 'var(--nafa-gray-200)' }} />
                </div>
                <div className="h-6 w-20 rounded-full" style={{ background: 'var(--nafa-gray-200)' }} />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded" style={{ background: 'var(--nafa-gray-200)' }} />
                <div className="h-3 w-3/4 rounded" style={{ background: 'var(--nafa-gray-200)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={q ? 'Aucun résultat' : showHidden ? 'Aucune commande masquée' : 'Aucune commande'}
          description={q ? `Aucune commande ne correspond à "${search}".` : showHidden ? 'Vous n\'avez masqué aucune commande.' : "Vous n'avez pas encore reçu de commandes."}
          action={q ? { label: 'Effacer la recherche', onClick: () => setSearch('') } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((order, i) => {
            const isSelected = selected.has(order.id);
            const isHidden = hiddenIds.has(order.id);
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}>
                <div
                  className="bg-white rounded-2xl p-5 border transition-shadow"
                  style={{
                    borderColor: isSelected ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)',
                    background: isSelected ? 'rgba(255,107,44,0.03)' : undefined,
                    cursor: selectMode ? 'pointer' : undefined,
                    boxShadow: isSelected ? '0 0 0 2px var(--nafa-orange)' : undefined,
                  }}
                  onClick={selectMode ? () => toggleSelect(order.id) : undefined}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {selectMode && (
                        <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                          style={{ borderColor: isSelected ? 'var(--nafa-orange)' : 'var(--nafa-gray-400)', background: isSelected ? 'var(--nafa-orange)' : 'transparent' }}>
                          {isSelected && <span style={{ color: 'white', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                        </div>
                      )}
                      <div>
                        <p className="text-xs nafa-mono font-semibold" style={{ color: 'var(--nafa-orange)' }}>
                          {formatOrderId(order.id)}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }} suppressHydrationWarning>
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isHidden && !selectMode && (
                        <button onClick={(e) => { e.stopPropagation(); unhideOrder(order.id); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                          style={{ background: 'rgba(255,107,44,0.08)', color: 'var(--nafa-orange)' }}>
                          <Eye size={11} strokeWidth={1.75} />Afficher
                        </button>
                      )}
                      <div className="text-right">
                        <p className="text-base font-black nafa-mono" style={{ color: 'var(--nafa-black)' }}>
                          {formatCurrency(order.total, order.currency)}
                        </p>
                        <div className="mt-1">
                          <StatusBadge status={order.orderStatus} />
                        </div>
                      </div>
                      {!selectMode && (
                        <Link href={`/vendor/orders/${order.id}`} onClick={(e) => e.stopPropagation()}>
                          <ChevronRight size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)', flexShrink: 0 }} />
                        </Link>
                      )}
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
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Floating action bar */}
      <AnimatePresence>
        {selectMode && selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl"
            style={{ background: 'var(--nafa-black)', minWidth: 260 }}>
            <span className="text-sm font-semibold text-white flex-1">
              {selected.size} sélectionnée{selected.size > 1 ? 's' : ''}
            </span>
            <button
              onClick={hideSelected}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: 'var(--nafa-orange)' }}>
              <EyeOff size={13} strokeWidth={2} />
              Masquer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {selectMode && selected.size > 0 && <div className="h-24" />}
    </div>
  );
}
