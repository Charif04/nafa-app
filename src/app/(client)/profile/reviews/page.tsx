'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { RatingStars } from '@/components/shared/RatingStars';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatRelativeTime } from '@/lib/utils';

interface MockReview {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  vendorName: string;
  rating: number;
  text: string;
  createdAt: string;
}

const MOCK_REVIEWS: MockReview[] = [
  {
    id: 'r1',
    productId: 'p1',
    productName: 'Boubou brodé homme',
    productImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop',
    vendorName: 'Boutique Aminata',
    rating: 5,
    text: 'Très belle qualité, les broderies sont magnifiques. Livraison rapide et emballage soigné.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'r2',
    productId: 'p2',
    productName: 'Sac en cuir artisanal',
    productImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop',
    vendorName: 'Mode Dakar',
    rating: 4,
    text: 'Beau sac, cuir de bonne qualité. La couleur correspond bien aux photos.',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'r3',
    productId: 'p3',
    productName: 'Tissu wax imprimé 6 yards',
    productImage: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=200&h=200&fit=crop',
    vendorName: 'Tissus Kodjo',
    rating: 5,
    text: 'Couleurs vives et tissu authentique. Je recommande vivement cette boutique.',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: 'r4',
    productId: 'p4',
    productName: 'Sandales en cuir tressé',
    productImage: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=200&h=200&fit=crop',
    vendorName: 'Artisan Chaussures',
    rating: 3,
    text: 'Bonne qualité mais taille un peu petit. Prévoir une pointure au-dessus.',
    createdAt: new Date(Date.now() - 86400000 * 21).toISOString(),
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

export default function ReviewsPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
      <div className="max-w-2xl mx-auto px-4 md:px-6">
      {/* Sticky header */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 py-4"
        style={{ background: 'var(--nafa-white)', borderBottom: '1px solid var(--nafa-gray-200)' }}
      >
        <Link
          href="/profile"
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'var(--nafa-gray-100)' }}
          aria-label="Retour"
        >
          <ChevronLeft size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-black)' }} />
        </Link>
        <h1 className="text-lg font-bold" style={{ color: 'var(--nafa-black)' }}>
          Mes avis
        </h1>
        <span
          className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}
        >
          {MOCK_REVIEWS.length}
        </span>
      </header>

      <div className="py-4">
        {MOCK_REVIEWS.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Aucun avis"
            description="Vous n'avez pas encore laissé d'avis"
            action={{ label: 'Explorer les produits', onClick: () => router.push('/home') }}
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <AnimatePresence>
              {MOCK_REVIEWS.map((review) => (
                <motion.article
                  key={review.id}
                  variants={cardVariants}
                  layout
                  className="rounded-2xl p-4"
                  style={{ background: 'var(--nafa-white)' }}
                >
                  {/* Product info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 relative">
                      <Image
                        src={review.productImage}
                        alt={review.productName}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${review.productId}`}
                        className="text-sm font-semibold line-clamp-1"
                        style={{ color: 'var(--nafa-gray-900)' }}
                      >
                        {review.productName}
                      </Link>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }}>
                        {review.vendorName}
                      </p>
                    </div>
                    <p className="text-xs flex-shrink-0" style={{ color: 'var(--nafa-gray-400)' }}>
                      {formatRelativeTime(review.createdAt)}
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="mb-2">
                    <RatingStars rating={review.rating} size={14} showValue />
                  </div>

                  {/* Review text */}
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--nafa-gray-700)' }}>
                    {review.text}
                  </p>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
      </div>
    </div>
  );
}
