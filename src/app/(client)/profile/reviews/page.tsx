'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MessageSquare, Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RatingStars } from '@/components/shared/RatingStars';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/shared/SkeletonShimmer';
import { formatRelativeTime } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

interface ReviewRow {
  id: string;
  orderId: string;
  vendorName: string;
  firstItemTitle: string;
  firstItemImage: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export default function ReviewsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) loadReviews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadReviews() {
    setIsLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: rows } = await db
      .from('reviews')
      .select(`
        id, order_id, rating, comment, created_at,
        vendor:profiles!reviews_to_user_id_fkey(
          vendor_profiles(shop_name)
        ),
        order:orders!reviews_order_id_fkey(
          order_items(title, image)
        )
      `)
      .eq('from_user_id', user!.uid)
      .eq('type', 'client_to_vendor')
      .order('created_at', { ascending: false });

    if (rows) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setReviews(rows.map((r: any) => {
        const vp = Array.isArray(r.vendor?.vendor_profiles)
          ? r.vendor.vendor_profiles[0]
          : r.vendor?.vendor_profiles;
        const items = r.order?.order_items ?? [];
        const firstItem = items[0];
        return {
          id: r.id,
          orderId: r.order_id,
          vendorName: vp?.shop_name ?? 'Boutique',
          firstItemTitle: firstItem?.title ?? 'Commande',
          firstItemImage: firstItem?.image ?? null,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.created_at,
        };
      }));
    }
    setIsLoading(false);
  }

  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <header className="sticky top-0 md:top-16 z-10 flex items-center gap-3 py-4"
          style={{ background: 'var(--nafa-white)', borderBottom: '1px solid var(--nafa-gray-200)' }}>
          <Link href="/profile" className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--nafa-gray-100)' }} aria-label="Retour">
            <ChevronLeft size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-black)' }} />
          </Link>
          <h1 className="text-lg font-bold" style={{ color: 'var(--nafa-black)' }}>Mes avis</h1>
          {!isLoading && (
            <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}>
              {reviews.length}
            </span>
          )}
        </header>

        <div className="py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl p-4" style={{ background: 'var(--nafa-white)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-24 rounded mb-2" />
                  <Skeleton className="h-4 w-full rounded" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Aucun avis"
              description="Vos avis apparaîtront ici après la livraison d'une commande."
              action={{ label: 'Explorer les produits', onClick: () => router.push('/home') }}
            />
          ) : (
            <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
              initial="hidden" animate="visible" className="space-y-3">
              <AnimatePresence>
                {reviews.map((review) => (
                  <motion.article key={review.id} variants={cardVariants} layout
                    className="rounded-2xl p-4" style={{ background: 'var(--nafa-white)' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                        style={{ background: 'var(--nafa-gray-100)' }}>
                        {review.firstItemImage
                          ? <img src={review.firstItemImage} alt={review.firstItemTitle}
                              className="w-full h-full object-cover" />
                          : <Package size={20} style={{ color: 'var(--nafa-gray-400)' }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold line-clamp-1" style={{ color: 'var(--nafa-gray-900)' }}>
                          {review.firstItemTitle}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }}>
                          {review.vendorName}
                        </p>
                      </div>
                      <p className="text-xs flex-shrink-0" style={{ color: 'var(--nafa-gray-400)' }}>
                        {formatRelativeTime(review.createdAt)}
                      </p>
                    </div>

                    <div className="mb-2">
                      <RatingStars rating={review.rating} size={14} showValue />
                    </div>

                    {review.comment && (
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--nafa-gray-700)' }}>
                        {review.comment}
                      </p>
                    )}
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
