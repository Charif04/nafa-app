'use client';
import { motion } from 'framer-motion';
import { Heart, ChevronLeft, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWishlistStore } from '@/stores/wishlistStore';
import { ProductCard } from '@/components/shared/ProductCard';
import { EmptyState } from '@/components/shared/EmptyState';

export default function FavoritesPage() {
  const router = useRouter();
  const items = useWishlistStore((s) => s.items);

  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
      <header
        className="sticky top-0 md:top-16 z-10 flex items-center gap-3 px-4 md:px-6 lg:px-10 py-4"
        style={{ background: 'var(--nafa-white)', borderBottom: '1px solid var(--nafa-gray-200)' }}
      >
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--nafa-gray-100)' }}
          aria-label="Retour"
        >
          <ChevronLeft size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-black)' }} />
        </button>
        <h1 className="text-lg font-bold flex-1" style={{ color: 'var(--nafa-black)' }}>
          Mes favoris
        </h1>
        {items.length > 0 && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}
          >
            {items.length}
          </span>
        )}
      </header>

      <main className="px-4 md:px-6 lg:px-10 py-4">
        {items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Aucun favori"
            description="Appuie sur le ❤ sur un produit pour l'ajouter à tes favoris."
            action={{ label: 'Explorer les produits', onClick: () => router.push('/shop') }}
          />
        ) : (
          <>
            <p className="text-xs mb-4" style={{ color: 'var(--nafa-gray-400)' }}>
              {items.length} produit{items.length > 1 ? 's' : ''} sauvegardé{items.length > 1 ? 's' : ''}
            </p>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.06 } }, hidden: {} }}
            >
              {items.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </motion.div>

            <div className="mt-8 text-center">
              <button
                onClick={() => router.push('/shop')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white"
                style={{ background: 'var(--nafa-orange)' }}
              >
                <ShoppingBag size={15} strokeWidth={1.75} />
                Continuer mes achats
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
