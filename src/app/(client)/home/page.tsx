'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Package, ChevronRight } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { ProductCard } from '@/components/shared/ProductCard';
import { ProductCardSkeleton } from '@/components/shared/SkeletonShimmer';
import { EmptyState } from '@/components/shared/EmptyState';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';

const CATEGORIES = [
  { id: 'all', label: 'Tous' },
  { id: 'electronics', label: 'Électronique' },
  { id: 'fashion', label: 'Mode' },
  { id: 'home', label: 'Maison' },
  { id: 'beauty', label: 'Beauté' },
  { id: 'sport', label: 'Sport' },
  { id: 'food', label: 'Alimentation' },
  { id: 'art', label: 'Artisanat' },
];


export default function HomePage() {
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*, vendor_profiles!inner(shop_name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data) {
        setProducts(data.map((row: any) => ({
          id: row.id,
          vendorId: row.vendor_id,
          vendorName: row.vendor_profiles?.shop_name ?? '',
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
        })));
      }
      setIsLoading(false);
    }
    load();
  }, []);

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-white)' }}>
      {/* Sticky header — visible on all screens, sits below top nav on desktop */}
      <header
        className="sticky top-0 md:top-16 z-30 px-4 md:px-6 lg:px-10 py-3"
        style={{ background: 'var(--nafa-white)', boxShadow: '0 1px 0 var(--nafa-gray-200)' }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Mobile: logo + search bar */}
          <div className="flex items-center gap-3 md:hidden">
            <Logo size="sm" className="flex-shrink-0" />
            <motion.button
              onClick={() => setSearchOpen(true)}
              className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm text-left"
              style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-400)' }}
              whileTap={{ scale: 0.99 }}
              aria-label="Rechercher un produit"
            >
              <Search size={15} strokeWidth={1.75} />
              <span>Rechercher un produit...</span>
            </motion.button>
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
          <div className="flex gap-2 mt-3 md:mt-0 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Catégories">
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
        </div>
      </header>

      {/* Mobile search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col md:hidden"
            style={{ background: 'var(--nafa-white)' }}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--nafa-gray-200)' }}>
              <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full border"
                style={{ borderColor: 'var(--nafa-orange)', background: 'var(--nafa-gray-100)' }}>
                <Search size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                <input
                  autoFocus
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: 'var(--nafa-black)' }}
                  aria-label="Recherche"
                />
                {search && (
                  <button onClick={() => setSearch('')} aria-label="Effacer">
                    <X size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                  </button>
                )}
              </div>
              <button
                onClick={() => { setSearchOpen(false); setSearch(''); }}
                className="text-sm font-medium"
                style={{ color: 'var(--nafa-orange)' }}
              >
                Annuler
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {search ? (
                <div>
                  <p className="text-xs mb-4" style={{ color: 'var(--nafa-gray-400)' }}>
                    {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} pour &quot;{search}&quot;
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium mb-3" style={{ color: 'var(--nafa-gray-700)' }}>Recherches populaires</p>
                  {['Boubou', 'Tissu wax', 'Bijoux', 'Artisanat', 'Huile karité'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSearch(s)}
                      className="flex items-center gap-3 w-full py-2.5 text-sm text-left"
                      style={{ borderBottom: '1px solid var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}
                    >
                      <Search size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promotional banner */}
      <div className="px-4 md:px-6 lg:px-10 pt-4 pb-0">
        <div className="max-w-7xl mx-auto">
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
      </div>

      {/* Products grid */}
      <main className="p-4 md:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: 'var(--nafa-black)' }}>
              Recommandés pour vous
            </h2>
            <button className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--nafa-orange)' }}>
              Voir tout <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Aucun produit trouvé"
              description="Essayez une autre recherche ou une autre catégorie."
              action={{ label: 'Voir tous les produits', onClick: () => { setActiveCategory('all'); setSearch(''); } }}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
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
