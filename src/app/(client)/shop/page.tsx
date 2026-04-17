'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, SlidersHorizontal, ChevronLeft, ArrowUpDown, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { clientPrice } from '@/lib/utils';
import { ProductCard } from '@/components/shared/ProductCard';
import { ProductCardSkeleton } from '@/components/shared/SkeletonShimmer';
import { EmptyState } from '@/components/shared/EmptyState';
import { useCategories } from '@/hooks/useCategories';
import type { Product } from '@/types';

const PRICE_RANGES = [
  { id: 'all', label: 'Tous les prix', min: 0, max: Infinity },
  { id: 'lt5k', label: '< 5 000', min: 0, max: 4999 },
  { id: '5k_15k', label: '5 000 – 15 000', min: 5000, max: 15000 },
  { id: '15k_50k', label: '15 000 – 50 000', min: 15000, max: 50000 },
  { id: 'gt50k', label: '> 50 000', min: 50001, max: Infinity },
];

type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'rating';
const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'newest', label: 'Plus récents' },
  { id: 'price_asc', label: 'Prix croissant' },
  { id: 'price_desc', label: 'Prix décroissant' },
  { id: 'rating', label: 'Mieux notés' },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const categories = useCategories();

  // Filters state
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activePriceRange, setActivePriceRange] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Load all products
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const { data } = await supabase
        .from('products')
        .select(`
          id, title, description, price, currency, images, category,
          stock, rating, review_count, created_at, updated_at, vendor_id,
          vendor:profiles!products_vendor_id_fkey(vendor_profiles(shop_name))
        `)
        .gt('stock', 0)
        .order('created_at', { ascending: false });

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setProducts(data.map((row: any) => {
          const vp = Array.isArray(row.vendor?.vendor_profiles)
            ? row.vendor.vendor_profiles[0]
            : row.vendor?.vendor_profiles;
          return {
            id: row.id,
            vendorId: row.vendor_id,
            vendorName: vp?.shop_name ?? '',
            title: row.title,
            description: row.description ?? '',
            price: Number(row.price),
            currency: row.currency,
            images: row.images ?? [],
            category: row.category ?? 'all',
            stock: row.stock,
            rating: Number(row.rating),
            reviewCount: row.review_count,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        }));
      }
      setIsLoading(false);
    }
    load();
  }, []);

  // Filter + sort
  const filtered = useCallback(() => {
    const priceRange = PRICE_RANGES.find((r) => r.id === activePriceRange) ?? PRICE_RANGES[0];
    let result = products.filter((p) => {
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.vendorName ?? '').toLowerCase().includes(search.toLowerCase());
      const cp = clientPrice(p.price);
      const matchPrice = cp >= priceRange.min && cp <= priceRange.max;
      return matchCat && matchSearch && matchPrice;
    });

    switch (sortKey) {
      case 'price_asc': result = [...result].sort((a, b) => a.price - b.price); break;
      case 'price_desc': result = [...result].sort((a, b) => b.price - a.price); break;
      case 'rating': result = [...result].sort((a, b) => b.rating - a.rating); break;
      default: break; // newest = already sorted by created_at desc from DB
    }
    return result;
  }, [products, search, activeCategory, activePriceRange, sortKey])();

  const activeFiltersCount = (activeCategory !== 'all' ? 1 : 0) + (activePriceRange !== 'all' ? 1 : 0) + (sortKey !== 'newest' ? 1 : 0);

  function clearFilters() {
    setActiveCategory('all');
    setActivePriceRange('all');
    setSortKey('newest');
  }

  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
      {/* ── Header ── */}
      <header
        className="nafa-client-header z-30 px-4 py-3 w-full"
        style={{ background: 'var(--nafa-white)', boxShadow: '0 1px 0 var(--nafa-gray-200)', overflowX: 'hidden' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--nafa-gray-100)' }}
            aria-label="Retour"
          >
            <ChevronLeft size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-black)' }} />
          </button>

          {/* Search bar */}
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl border" style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}>
            <Search size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit, une boutique…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--nafa-black)' }}
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X size={14} strokeWidth={2} style={{ color: 'var(--nafa-gray-400)' }} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="relative w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: activeFiltersCount > 0 ? 'var(--nafa-orange)' : 'var(--nafa-gray-100)' }}
            aria-label="Filtres"
          >
            <SlidersHorizontal size={16} strokeWidth={1.75} style={{ color: activeFiltersCount > 0 ? 'white' : 'var(--nafa-black)' }} />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: 'var(--nafa-black)' }}>
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors"
              style={{
                background: activeCategory === cat.name ? 'var(--nafa-orange)' : 'var(--nafa-gray-100)',
                color: activeCategory === cat.name ? 'white' : 'var(--nafa-gray-700)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Filter drawer ── */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.3)' }}
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col"
              style={{ background: 'var(--nafa-white)' }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--nafa-gray-200)' }}>
                <h2 className="font-bold text-base" style={{ color: 'var(--nafa-black)' }}>Filtres</h2>
                <button onClick={() => setShowFilters(false)}>
                  <X size={18} strokeWidth={2} style={{ color: 'var(--nafa-gray-700)' }} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                {/* Sort */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--nafa-gray-400)' }}>
                    <ArrowUpDown size={12} className="inline mr-1" />Trier par
                  </p>
                  <div className="space-y-1.5">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSortKey(opt.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left"
                        style={{
                          background: sortKey === opt.id ? 'rgba(255,107,44,0.08)' : 'var(--nafa-gray-100)',
                          color: sortKey === opt.id ? 'var(--nafa-orange)' : 'var(--nafa-gray-900)',
                          fontWeight: sortKey === opt.id ? 600 : 400,
                        }}
                      >
                        {opt.label}
                        {sortKey === opt.id && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--nafa-orange)' }} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--nafa-gray-400)' }}>
                    Prix (FCFA)
                  </p>
                  <div className="space-y-1.5">
                    {PRICE_RANGES.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setActivePriceRange(r.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left"
                        style={{
                          background: activePriceRange === r.id ? 'rgba(255,107,44,0.08)' : 'var(--nafa-gray-100)',
                          color: activePriceRange === r.id ? 'var(--nafa-orange)' : 'var(--nafa-gray-900)',
                          fontWeight: activePriceRange === r.id ? 600 : 400,
                        }}
                      >
                        {r.label}
                        {activePriceRange === r.id && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--nafa-orange)' }} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t space-y-2" style={{ borderColor: 'var(--nafa-gray-200)' }}>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => { clearFilters(); setShowFilters(false); }}
                    className="w-full py-3 rounded-2xl text-sm font-semibold"
                    style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}
                  >
                    Réinitialiser les filtres
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full py-3 rounded-2xl text-sm font-semibold text-white"
                  style={{ background: 'var(--nafa-orange)' }}
                >
                  Voir {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Results ── */}
      <main className="px-4 md:px-6 lg:px-10 py-4">
        {/* Result count + active filters */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>
            {isLoading ? (
              <span className="animate-pulse">Chargement…</span>
            ) : (
              <><strong>{filtered.length}</strong> produit{filtered.length !== 1 ? 's' : ''}</>
            )}
          </p>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs flex items-center gap-1"
              style={{ color: 'var(--nafa-orange)' }}
            >
              <X size={12} strokeWidth={2} />
              Effacer les filtres
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Aucun produit trouvé"
            description={search ? `Aucun résultat pour "${search}"` : 'Essayez de modifier vos filtres.'}
            action={activeFiltersCount > 0 ? { label: 'Réinitialiser', onClick: clearFilters } : undefined}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
