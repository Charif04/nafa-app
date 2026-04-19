'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Package, ChevronRight, Search, X, EyeOff, Eye, CheckSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { OrderCardSkeleton } from '@/components/shared/SkeletonShimmer';
import { formatCurrency, formatOrderId } from '@/lib/utils';
import { useClientOrdersStore } from '@/stores/clientOrdersStore';
import { useAuthStore } from '@/stores/authStore';

const STORAGE_KEY = 'nafa_hidden_client_orders';

export default function OrdersPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { orders, isLoading, error, fetchOrders, subscribeRealtime, unsubscribe } = useClientOrdersStore();
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

  const filtered = q
    ? visibleOrders.filter((o) =>
        formatOrderId(o.id).toLowerCase().includes(q) ||
        o.items.some((it) => it.title.toLowerCase().includes(q)) ||
        (o.vendorName ?? '').toLowerCase().includes(q)
      )
    : visibleOrders;

  const hiddenCount = hiddenIds.size;

  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
    <div className="max-w-2xl mx-auto">
      <header className="nafa-client-header z-10 px-4 md:px-6 lg:px-10 py-3"
        style={{ background: 'var(--nafa-white)', borderBottom: '1px solid var(--nafa-gray-200)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--nafa-gray-100)' }} aria-label="Retour">
            <ChevronLeft size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-black)' }} />
          </button>
          <h1 className="text-lg font-bold flex-1" style={{ color: 'var(--nafa-black)' }}>Mes commandes</h1>
          <div className="flex items-center gap-2">
            {hiddenCount > 0 && !selectMode && (
              <button
                onClick={() => { setShowHidden((v) => !v); setSelected(new Set()); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                style={{ borderColor: showHidden ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)', color: showHidden ? 'var(--nafa-orange)' : 'var(--nafa-gray-700)', background: showHidden ? 'rgba(255,107,44,0.06)' : 'white' }}>
                {showHidden ? <Eye size={12} strokeWidth={1.75} /> : <EyeOff size={12} strokeWidth={1.75} />}
                {showHidden ? 'Visibles' : `(${hiddenCount})`}
              </button>
            )}
            {!selectMode ? (
              <button onClick={() => setSelectMode(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--nafa-gray-100)' }} aria-label="Sélectionner">
                <CheckSquare size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />
              </button>
            ) : (
              <button onClick={cancelSelectMode}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--nafa-gray-100)' }} aria-label="Annuler">
                <X size={15} strokeWidth={2} style={{ color: 'var(--nafa-gray-700)' }} />
              </button>
            )}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}>
              {filtered.length}
            </span>
          </div>
        </div>
        {/* Search bar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}>
          <Search size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par ID, produit ou boutique…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--nafa-black)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Effacer">
              <X size={13} strokeWidth={2} style={{ color: 'var(--nafa-gray-400)' }} />
            </button>
          )}
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-10 py-4 space-y-3">
        {error && (
          <div className="px-4 py-3 rounded-xl text-sm font-medium mb-2"
            style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--nafa-error)', border: '1px solid rgba(239,68,68,0.2)' }}>
            Erreur : {error}
          </div>
        )}

        {/* Hidden mode banner */}
        {showHidden && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(255,107,44,0.06)', border: '1px solid rgba(255,107,44,0.15)' }}>
            <EyeOff size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
            <p className="text-xs flex-1" style={{ color: 'var(--nafa-gray-700)' }}>
              Commandes masquées — appuyez sur <strong>Visibles</strong> pour revenir.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <OrderCardSkeleton key={i} />)}
          </div>
        ) : error ? null : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title={q ? 'Aucun résultat' : showHidden ? 'Aucune commande masquée' : 'Aucune commande'}
            description={q ? `Aucune commande ne correspond à "${search}".` : showHidden ? 'Vous n\'avez masqué aucune commande.' : "Vous n'avez pas encore passé de commande."}
            action={q ? { label: 'Effacer la recherche', onClick: () => setSearch('') } : (!showHidden ? { label: 'Explorer les produits', onClick: () => router.push('/home') } : undefined)}
          />
        ) : (
          filtered.map((order, i) => {
            const isSelected = selected.has(order.id);
            const isHidden = hiddenIds.has(order.id);
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <div
                  className="block bg-white rounded-2xl p-4 border transition-shadow"
                  style={{
                    borderColor: isSelected ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)',
                    boxShadow: isSelected ? '0 0 0 2px var(--nafa-orange)' : undefined,
                    cursor: 'pointer',
                  }}
                  onClick={selectMode ? () => toggleSelect(order.id) : () => router.push(`/profile/orders/${order.id}`)}>
                  <div className="flex items-start gap-3">
                    {selectMode ? (
                      <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-colors"
                        style={{ borderColor: isSelected ? 'var(--nafa-orange)' : 'var(--nafa-gray-400)', background: isSelected ? 'var(--nafa-orange)' : 'transparent' }}>
                        {isSelected && <span style={{ color: 'white', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                      </div>
                    ) : order.items[0]?.image ? (
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
                        {formatOrderId(order.id)}
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
                      {isHidden && !selectMode && (
                        <button onClick={(e) => { e.stopPropagation(); unhideOrder(order.id); }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium"
                          style={{ background: 'rgba(255,107,44,0.08)', color: 'var(--nafa-orange)' }}>
                          <Eye size={10} strokeWidth={1.75} />Afficher
                        </button>
                      )}
                    </div>
                    {!selectMode && (
                      <ChevronRight size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)', alignSelf: 'center' }} />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>

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
