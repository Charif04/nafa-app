'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Heart, Package, ShoppingBag, Calendar, Star } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatRelativeTime } from '@/lib/utils';
import { RatingStars } from '@/components/shared/RatingStars';
import { ProductCard } from '@/components/shared/ProductCard';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Product } from '@/types';

interface VendorReview {
  id: string;
  reviewerName: string;
  initials: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface VendorData {
  id: string;
  shopName: string;
  shopDescription: string;
  rating: number;
  reviewCount: number;
  followerCount: number;
  totalSales: number;
  createdAt: string;
  isVerified: boolean;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function VendorStorefrontPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const vendorId = params.id;

  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<VendorReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      // Fetch vendor profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: vpRow } = await (supabase as any)
        .from('vendor_profiles')
        .select(`
          id, shop_name, shop_description, rating, review_count,
          total_sales, follower_count, created_at, is_verified
        `)
        .eq('id', vendorId)
        .maybeSingle();

      if (!vpRow) {
        setIsLoading(false);
        return;
      }

      const vendorData: VendorData = {
        id: vpRow.id,
        shopName: vpRow.shop_name ?? '',
        shopDescription: vpRow.shop_description ?? '',
        rating: Number(vpRow.rating),
        reviewCount: vpRow.review_count,
        followerCount: vpRow.follower_count,
        totalSales: vpRow.total_sales,
        createdAt: vpRow.created_at,
        isVerified: vpRow.is_verified,
      };
      setVendor(vendorData);
      setFollowerCount(vpRow.follower_count);

      // Check if current user follows this vendor
      if (user) {
        const { data: followRow } = await supabase
          .from('follows')
          .select('vendor_id')
          .eq('follower_id', user.id)
          .eq('vendor_id', vendorId)
          .maybeSingle();
        setIsFollowing(!!followRow);
      }

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsData) {
        setProducts(productsData.map((row: any) => ({
          id: row.id,
          vendorId: row.vendor_id,
          vendorName: vendorData.shopName,
          title: row.title,
          description: row.description ?? '',
          price: Number(row.price),
          currency: row.currency as Product['currency'],
          images: row.images ?? [],
          category: row.category ?? '',
          stock: row.stock,
          rating: Number(row.rating),
          reviewCount: row.review_count,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })));
      }

      // Fetch reviews
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: reviewsData } = await (supabase as any)
        .from('reviews')
        .select(`
          id, rating, comment, created_at,
          reviewer:profiles!reviews_from_user_id_fkey(first_name, last_name)
        `)
        .eq('to_user_id', vendorId)
        .eq('type', 'client_to_vendor')
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setReviews(reviewsData.map((r: any) => {
          const name = r.reviewer
            ? `${r.reviewer.first_name} ${r.reviewer.last_name}`.trim()
            : 'Client';
          return {
            id: r.id,
            reviewerName: name,
            initials: getInitials(name),
            rating: r.rating,
            comment: r.comment ?? '',
            createdAt: r.created_at,
          };
        }));
      }

      setIsLoading(false);
    }

    load();
  }, [vendorId]);

  const handleFollowToggle = async () => {
    if (!currentUserId || followLoading) return;
    setFollowLoading(true);

    try {
      if (isFollowing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('vendor_id', vendorId);
        setIsFollowing(false);
        setFollowerCount((c) => c - 1);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('follows')
          .insert({ follower_id: currentUserId, vendor_id: vendorId });
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);
      }
    } finally {
      setFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <header className="sticky top-0 md:top-16 z-10 flex items-center gap-3 py-4"
            style={{ background: 'var(--nafa-white)', borderBottom: '1px solid var(--nafa-gray-200)' }}>
            <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
            <div className="h-5 w-40 rounded-lg animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
          </header>
          <div className="py-6 space-y-4">
            <div className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
            <div className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square rounded-2xl animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-8" style={{ background: 'var(--nafa-white)' }}>
        <div className="text-center">
          <ShoppingBag size={48} strokeWidth={1.25} style={{ color: 'var(--nafa-gray-400)' }} className="mx-auto mb-4" />
          <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--nafa-black)' }}>Boutique introuvable</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--nafa-gray-700)' }}>
            Cette boutique n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <button onClick={() => router.push('/home')} className="text-sm font-semibold" style={{ color: 'var(--nafa-orange)' }}>
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  const initials = getInitials(vendor.shopName);

  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        {/* Sticky header */}
        <header
          className="sticky top-0 md:top-16 z-10 flex items-center gap-3 py-4"
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
          <h1 className="text-base font-bold truncate flex-1" style={{ color: 'var(--nafa-black)' }}>
            {vendor.shopName}
          </h1>
        </header>

        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* Hero section */}
          <motion.section variants={itemVariants} className="py-6" style={{ background: 'var(--nafa-white)' }}>
            <div className="lg:flex lg:items-start lg:gap-6">
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--nafa-orange), #ea580c)' }}
              >
                {initials}
              </div>

              {/* Info + follow */}
              <div className="flex-1 mt-4 lg:mt-0">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--nafa-black)' }}>
                      {vendor.shopName}
                    </h2>
                    {vendor.isVerified && (
                      <span
                        className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mt-1 mb-2"
                        style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-orange)' }}
                      >
                        Vendeur vérifié ✓
                      </span>
                    )}
                  </div>

                  {currentUserId && (
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors flex-shrink-0"
                      style={
                        isFollowing
                          ? { background: 'var(--nafa-orange)', borderColor: 'var(--nafa-orange)', color: 'white' }
                          : { background: 'transparent', borderColor: 'var(--nafa-orange)', color: 'var(--nafa-orange)' }
                      }
                      aria-label={isFollowing ? 'Ne plus suivre' : 'Suivre'}
                    >
                      <Heart size={14} strokeWidth={1.75} style={{ fill: isFollowing ? 'white' : 'transparent' }} />
                      {isFollowing ? 'Suivi' : 'Suivre'}
                    </motion.button>
                  )}
                </div>

                {vendor.shopDescription && (
                  <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--nafa-gray-700)' }}>
                    {vendor.shopDescription}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <RatingStars rating={vendor.rating} size={15} showValue reviewCount={vendor.reviewCount} />
                  <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>
                    &bull; {followerCount.toLocaleString('fr-FR')} abonnés
                  </span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Stats row */}
          <motion.section
            variants={itemVariants}
            className="my-4 rounded-2xl overflow-hidden"
            style={{ background: 'var(--nafa-white)' }}
          >
            <div className="grid grid-cols-3 divide-x">
              <div className="flex flex-col items-center py-4 gap-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-1" style={{ background: 'var(--nafa-gray-100)' }}>
                  <Package size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                </div>
                <span className="text-base font-bold" style={{ color: 'var(--nafa-black)' }}>{products.length}</span>
                <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>Produits</span>
              </div>

              <div className="flex flex-col items-center py-4 gap-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-1" style={{ background: 'var(--nafa-gray-100)' }}>
                  <ShoppingBag size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                </div>
                <span className="text-base font-bold" style={{ color: 'var(--nafa-black)' }}>
                  {vendor.totalSales.toLocaleString('fr-FR')}
                </span>
                <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>Ventes</span>
              </div>

              <div className="flex flex-col items-center py-4 gap-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-1" style={{ background: 'var(--nafa-gray-100)' }}>
                  <Calendar size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                </div>
                <span className="text-base font-bold" style={{ color: 'var(--nafa-black)' }}>
                  {new Date(vendor.createdAt).getFullYear()}
                </span>
                <span className="text-xs text-center leading-tight" style={{ color: 'var(--nafa-gray-400)' }} suppressHydrationWarning>
                  Depuis {new Date(vendor.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </motion.section>

          {/* Products grid */}
          <motion.section variants={itemVariants} className="pb-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--nafa-gray-900)' }}>
              Produits de la boutique
            </h3>
            {products.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Aucun produit"
                description="Cette boutique n'a pas encore de produits disponibles."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}
          </motion.section>

          {/* Reviews */}
          <motion.section variants={itemVariants} className="pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--nafa-gray-900)' }}>
                Avis clients
              </h3>
              <div className="flex items-center gap-1.5">
                <Star size={14} strokeWidth={1.75} style={{ fill: 'var(--nafa-orange)', color: 'var(--nafa-orange)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>{vendor.rating.toFixed(1)}</span>
                <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>({vendor.reviewCount} avis)</span>
              </div>
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--nafa-gray-400)' }}>
                Aucun avis pour le moment.
              </p>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 rounded-2xl" style={{ background: 'var(--nafa-white)' }}>
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--nafa-orange), #e55a00)' }}
                      >
                        {review.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold" style={{ color: 'var(--nafa-black)' }}>{review.reviewerName}</p>
                          <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }} suppressHydrationWarning>
                            {formatRelativeTime(review.createdAt)}
                          </span>
                        </div>
                        <RatingStars rating={review.rating} size={12} />
                        <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--nafa-gray-700)' }}>
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
