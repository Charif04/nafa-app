'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Package, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { ProductCard } from '@/components/shared/ProductCard';
import { ProductCardSkeleton } from '@/components/shared/SkeletonShimmer';
import { EmptyState } from '@/components/shared/EmptyState';
import { supabase } from '@/lib/supabase';
import { clientPrice } from '@/lib/utils';
import type { Product } from '@/types';

const CATEGORIES = [
  { id: 'all', label: 'Tous' },
  { id: 'mode', label: 'Mode' },
  { id: 'électronique', label: 'Électronique' },
  { id: 'maison', label: 'Maison' },
  { id: 'beauté', label: 'Beauté' },
  { id: 'sport', label: 'Sport' },
  { id: 'alimentation', label: 'Alimentation' },
  { id: 'artisanat', label: 'Artisanat' },
  { id: 'bijoux', label: 'Bijoux' },
  { id: 'autre', label: 'Autre' },
];

const PRICE_RANGES = [
  { id: 'all', label: 'Tous les prix', min: 0, max: Infinity },
  { id: 'lt5k', label: '< 5 000', min: 0, max: 4999 },
  { id: '5k_15k', label: '5 000–15 000', min: 5000, max: 15000 },
  { id: '15k_50k', label: '15 000–50 000', min: 15000, max: 50000 },
  { id: 'gt50k', label: '> 50 000', min: 50001, max: Infinity },
];


export default function HomePage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activePriceRange, setActivePriceRange] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const { data } = await supabase
        .from('products')
        .select(`
          *,
          vendor:profiles!products_vendor_id_fkey(
            vendor_profiles(shop_name)
          )
        `)
        .eq('is_active', true)
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
          currency: row.currency as Product['currency'],
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

  const priceRange = PRICE_RANGES.find((r) => r.id === activePriceRange) ?? PRICE_RANGES[0];

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    const cp = clientPrice(p.price);
    const matchPrice = cp >= priceRange.min && cp <= priceRange.max;
    return matchCat && matchSearch && matchPrice;
  });

  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-white)' }}>
      {/* Sticky header */}
      <header
        className="nafa-client-header z-30 px-4 md:px-6 lg:px-10 py-3 w-full"
        style={{ background: 'var(--nafa-white)', boxShadow: '0 1px 0 var(--nafa-gray-200)', overflowX: 'hidden' }}
      >
        {/* Mobile: logo + inline search input */}
        <div className="flex items-center gap-3 mb-3 md:hidden">
          <Logo size="sm" className="flex-shrink-0" />
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full border"
            style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}>
            <Search size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--nafa-black)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} aria-label="Effacer">
                <X size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
              </button>
            )}
          </div>
        </div>

        {/* Desktop: search bar only (logo is in top nav) */}
        <div className="hidden md:flex items-center gap-4 mb-3">
          <div className="flex-1 relative">
            <Search size={16} strokeWidth={1.75} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit, une boutique..."
              className="w-full pl-11 pr-4 py-3 rounded-full border text-sm outline-none transition-colors"
              style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)', color: 'var(--nafa-black)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--nafa-orange)'; e.target.style.background = 'white'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--nafa-gray-200)'; e.target.style.background = 'var(--nafa-gray-100)'; }}
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Catégories">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.id}
              role="tab"
              aria-selected={activeCategory === cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.id)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                background: activeCategory === cat.id ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)',
                color: activeCategory === cat.id ? 'var(--nafa-white)' : 'var(--nafa-gray-700)',
              }}
            >
              {cat.label}
            </motion.button>
          ))}
        </div>

        {/* Price range chips */}
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Fourchette de prix">
          {PRICE_RANGES.map((range) => (
            <motion.button
              key={range.id}
              role="tab"
              aria-selected={activePriceRange === range.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActivePriceRange(range.id)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors border"
              style={{
                background: activePriceRange === range.id ? 'rgba(255,107,44,0.1)' : 'transparent',
                borderColor: activePriceRange === range.id ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)',
                color: activePriceRange === range.id ? 'var(--nafa-orange)' : 'var(--nafa-gray-700)',
              }}
            >
              {range.label}{range.id !== 'all' ? ' FCFA' : ''}
            </motion.button>
          ))}
        </div>
      </header>

      {/* Promotional banner */}
      <div className="px-4 md:px-6 lg:px-10 pt-4 pb-0">
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl p-5 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, var(--nafa-orange) 0%, var(--nafa-orange-dark) 100%)' }}
          >
            {/* Decorative circles */}
            <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="absolute right-8 -bottom-6 w-20 h-20 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <div className="relative z-10">
              <p className="text-xs font-bold tracking-widest uppercase text-white/80 mb-1">Vente Flash</p>
              <h2 className="text-base font-bold text-white leading-snug mb-3">
                Jusqu&apos;à 40% de réduction<br />sur l&apos;artisanat africain
              </h2>
              <button className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                style={{ background: 'white', color: 'var(--nafa-orange)' }}>
                Découvrir <ChevronRight size={13} strokeWidth={2} />
              </button>
            </div>
            <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}>
              <Package size={30} strokeWidth={1.5} className="text-white" />
            </div>
        </motion.div>
      </div>

      {/* Products grid */}
      <main className="p-4 md:px-6 lg:px-10">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: 'var(--nafa-black)' }}>
              Recommandés pour vous
            </h2>
            <Link href="/shop" className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--nafa-orange)' }}>
              Voir tout <ChevronRight size={14} strokeWidth={2} />
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Aucun produit trouvé"
              description="Essayez une autre recherche ou une autre catégorie."
              action={{ label: 'Voir tous les produits', onClick: () => { setActiveCategory('all'); setSearch(''); setActivePriceRange('all'); } }}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
