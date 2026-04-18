'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Heart, Package, ShoppingBag, Star, BadgeCheck, Users } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatRelativeTime } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { RatingStars } from '@/components/shared/RatingStars';
import { ProductCard } from '@/components/shared/ProductCard';
import { ProductCardSkeleton } from '@/components/shared/SkeletonShimmer';
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

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2);
}

function StatPill({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-0">
      <span className="text-base font-black" style={{ color: 'var(--nafa-black)' }}>{value}</span>
      <span className="text-[11px]" style={{ color: 'var(--nafa-gray-400)' }}>{label}</span>
    </div>
  );
}

export default function VendorStorefrontPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const vendorId = params.id;
  const currentUser = useAuthStore((s) => s.user);

  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<VendorReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: vpRow } = await (supabase as any)
        .from('vendor_profiles')
        .select('id, shop_name, shop_description, rating, review_count, total_sales, follower_count, created_at, is_verified')
        .eq('id', vendorId)
        .maybeSingle();

      if (!vpRow) { setIsLoading(false); return; }

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

      if (currentUser?.uid) {
        const { data: followRow } = await supabase
          .from('follows').select('vendor_id')
          .eq('follower_id', currentUser.uid).eq('vendor_id', vendorId).maybeSingle();
        setIsFollowing(!!followRow);
      }

      const { data: productsData } = await supabase
        .from('products').select('*')
        .eq('vendor_id', vendorId).eq('is_active', true).order('created_at', { ascending: false });

      if (productsData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setProducts(productsData.map((row: any) => ({
          id: row.id, vendorId: row.vendor_id, vendorName: vendorData.shopName,
          title: row.title, description: row.description ?? '',
          price: Number(row.price), currency: row.currency as Product['currency'],
          images: row.images ?? [], category: row.category ?? '',
          stock: row.stock, rating: Number(row.rating), reviewCount: row.review_count,
          createdAt: row.created_at, updatedAt: row.updated_at,
        })));
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: reviewsData } = await (supabase as any)
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer:profiles!reviews_from_user_id_fkey(first_name, last_name)')
        .eq('to_user_id', vendorId).eq('type', 'client_to_vendor')
        .order('created_at', { ascending: false }).limit(10);

      if (reviewsData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setReviews(reviewsData.map((r: any) => {
          const name = r.reviewer ? `${r.reviewer.first_name} ${r.reviewer.last_name}`.trim() : 'Client';
          return { id: r.id, reviewerName: name, initials: getInitials(name), rating: r.rating, comment: r.comment ?? '', createdAt: r.created_at };
        }));
      }

      setIsLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const handleFollowToggle = async () => {
    if (!currentUser?.uid || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('follows').delete().eq('follower_id', currentUser.uid).eq('vendor_id', vendorId);
        setIsFollowing(false); setFollowerCount((c) => c - 1);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('follows').insert({ follower_id: currentUser.uid, vendor_id: vendorId });
        setIsFollowing(true); setFollowerCount((c) => c + 1);
      }
    } finally { setFollowLoading(false); }
  };

  /* ─── Loading skeleton ─── */
  if (isLoading) {
    return (
      <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
        {/* Cover skeleton */}
        <div className="h-44 md:h-52 animate-pulse" style={{ background: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)', opacity: 0.3 }} />
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-10 mb-6">
            <div className="w-20 h-20 rounded-2xl animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
            <div className="flex-1 space-y-2 pt-2">
              <div className="h-5 w-40 rounded-lg animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
              <div className="h-3 w-24 rounded-lg animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-8" style={{ background: 'var(--nafa-white)' }}>
        <EmptyState icon={ShoppingBag} title="Boutique introuvable" description="Cette boutique n'existe pas ou n'est plus disponible."
          action={{ label: 'Retour à l\'accueil', onClick: () => router.push('/home') }} />
      </div>
    );
  }

  const initials = getInitials(vendor.shopName);
  const sinceYear = new Date(vendor.createdAt).getFullYear();

  /* ─── Sidebar info (reused in desktop left col) ─── */
  const vendorInfoCard = (
    <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--nafa-white)', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
      {/* Card cover strip */}
      <div className="h-16 relative" style={{ background: 'linear-gradient(135deg, var(--nafa-orange) 0%, #c2410c 100%)' }}>
        <div className="absolute -bottom-8 left-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl border-4 border-white"
            style={{ background: 'linear-gradient(135deg, #ea580c, #9a3412)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          >
            {initials}
          </div>
        </div>
      </div>

      <div className="px-5 pt-11 pb-5">
        {/* Name + verified */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="text-base font-bold leading-tight" style={{ color: 'var(--nafa-black)' }}>{vendor.shopName}</h2>
          {vendor.isVerified && (
            <BadgeCheck size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)', flexShrink: 0 }} />
          )}
        </div>

        {/* Rating row */}
        <div className="flex items-center gap-2 mb-3">
          <RatingStars rating={vendor.rating} size={13} showValue reviewCount={vendor.reviewCount} />
          <span className="text-[11px]" style={{ color: 'var(--nafa-gray-400)' }}>
            · {followerCount.toLocaleString('fr-FR')} abonnés
          </span>
        </div>

        {/* Description */}
        {vendor.shopDescription && (
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--nafa-gray-700)' }}>
            {vendor.shopDescription}
          </p>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: Package, value: products.length, label: 'Produits' },
            { icon: ShoppingBag, value: vendor.totalSales, label: 'Ventes' },
            { icon: Users, value: followerCount, label: 'Abonnés' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5 py-2.5 rounded-2xl" style={{ background: 'var(--nafa-gray-100)' }}>
              <Icon size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
              <span className="text-sm font-black" style={{ color: 'var(--nafa-black)' }}>{Number(value).toLocaleString('fr-FR')}</span>
              <span className="text-[10px]" style={{ color: 'var(--nafa-gray-400)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Membre depuis */}
        <p className="text-xs mb-4" style={{ color: 'var(--nafa-gray-400)' }}>
          Boutique ouverte depuis <strong style={{ color: 'var(--nafa-gray-700)' }}>{sinceYear}</strong>
        </p>

        {/* Follow button */}
        {currentUser?.uid && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleFollowToggle}
            disabled={followLoading}
            className="w-full py-2.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={isFollowing
              ? { background: 'var(--nafa-orange)', color: 'white' }
              : { background: 'rgba(255,107,44,0.08)', color: 'var(--nafa-orange)' }
            }
          >
            <Heart size={15} strokeWidth={2} style={{ fill: isFollowing ? 'white' : 'transparent' }} />
            {isFollowing ? 'Boutique suivie' : 'Suivre la boutique'}
          </motion.button>
        )}
      </div>
    </div>
  );

  /* ─── Reviews list ─── */
  const reviewsList = (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>Avis clients</h3>
        {vendor.reviewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Star size={13} strokeWidth={0} className="fill-[var(--nafa-orange)]" />
            <span className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>{vendor.rating.toFixed(1)}</span>
            <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>({vendor.reviewCount})</span>
          </div>
        )}
      </div>
      {reviews.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--nafa-gray-400)' }}>
          Aucun avis pour le moment.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl"
              style={{ background: 'var(--nafa-white)', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
            >
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
                  {review.comment && (
                    <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--nafa-gray-700)' }}>
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>

      {/* ── Back button (floating, always visible) ── */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.92)', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', backdropFilter: 'blur(8px)' }}
          aria-label="Retour"
        >
          <ChevronLeft size={18} strokeWidth={2} style={{ color: 'var(--nafa-black)' }} />
        </button>
      </div>

      {/* ── Desktop sticky header ── */}
      <header className="hidden md:flex nafa-client-header z-30 items-center gap-3 px-6 lg:px-10 py-3"
        style={{ background: 'var(--nafa-white)', borderBottom: '1px solid var(--nafa-gray-200)' }}>
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--nafa-gray-100)' }}
          aria-label="Retour"
        >
          <ChevronLeft size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-black)' }} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>{vendor.shopName}</span>
          {vendor.isVerified && <BadgeCheck size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />}
        </div>
      </header>

      {/* ── Cover banner (mobile only) ── */}
      <div
        className="relative md:hidden"
        style={{ background: 'linear-gradient(135deg, var(--nafa-orange) 0%, #9a3412 100%)', height: 140 }}
      >
        {/* Decorative blobs */}
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <div className="absolute left-12 -bottom-6 w-28 h-28 rounded-full" style={{ background: 'rgba(0,0,0,0.1)' }} />
      </div>

      {/* ─────────────────── MOBILE LAYOUT ─────────────────── */}
      <div className="md:hidden">
        {/* Profile card — overlaps cover */}
        <div className="relative -mt-12 mx-4 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl overflow-hidden"
            style={{ background: 'var(--nafa-white)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          >
            {/* Avatar row */}
            <div className="flex items-end gap-3 px-5 pt-5 pb-3">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl flex-shrink-0 border-4 border-white"
                style={{
                  background: 'linear-gradient(135deg, var(--nafa-orange), #9a3412)',
                  boxShadow: '0 4px 16px rgba(255,107,44,0.3)',
                  marginTop: -32,
                }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold truncate" style={{ color: 'var(--nafa-black)' }}>{vendor.shopName}</h2>
                  {vendor.isVerified && <BadgeCheck size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)', flexShrink: 0 }} />}
                </div>
                <RatingStars rating={vendor.rating} size={12} showValue reviewCount={vendor.reviewCount} />
              </div>
            </div>

            {/* Description */}
            {vendor.shopDescription && (
              <p className="px-5 pb-3 text-xs leading-relaxed" style={{ color: 'var(--nafa-gray-700)' }}>
                {vendor.shopDescription}
              </p>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-4 divide-x px-2 pb-4" style={{ borderTop: '1px solid var(--nafa-gray-100)' }}>
              {[
                { icon: Package, value: products.length, label: 'Produits' },
                { icon: ShoppingBag, value: vendor.totalSales, label: 'Ventes' },
                { icon: Users, value: followerCount, label: 'Abonnés' },
                { icon: Star, value: vendor.rating.toFixed(1), label: 'Note' },
              ].map(({ icon: Icon, value, label }, idx) => (
                <div key={label} className={`flex flex-col items-center gap-0.5 pt-3 ${idx === 0 ? '' : ''}`}>
                  <span className="text-sm font-black" style={{ color: 'var(--nafa-black)' }}>
                    {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
                  </span>
                  <Icon size={11} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                  <span className="text-[10px]" style={{ color: 'var(--nafa-gray-400)' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Follow button */}
            {currentUser?.uid && (
              <div className="px-5 pb-5">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className="w-full py-2.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                  style={isFollowing
                    ? { background: 'var(--nafa-orange)', color: 'white' }
                    : { background: 'rgba(255,107,44,0.09)', color: 'var(--nafa-orange)' }
                  }
                >
                  <Heart size={14} strokeWidth={2} style={{ fill: isFollowing ? 'white' : 'transparent' }} />
                  {isFollowing ? 'Boutique suivie' : 'Suivre la boutique'}
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Products */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>
              Produits{products.length > 0 && <span className="ml-1.5 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--nafa-gray-200)', color: 'var(--nafa-gray-700)' }}>{products.length}</span>}
            </h3>
          </div>
          {products.length === 0 ? (
            <EmptyState icon={Package} title="Aucun produit" description="Cette boutique n'a pas encore de produits." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <ProductCard product={product} index={i} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="px-4 pb-24">
          <div className="rounded-3xl p-4" style={{ background: 'var(--nafa-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            {reviewsList}
          </div>
        </div>
      </div>

      {/* ─────────────────── DESKTOP LAYOUT ─────────────────── */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 lg:px-10 py-8">
        <div className="flex gap-8 items-start">

          {/* Left sidebar — sticky vendor info */}
          <div className="w-72 lg:w-80 flex-shrink-0 sticky top-6 space-y-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
              {vendorInfoCard}
            </motion.div>

            {/* Reviews sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-3xl p-5"
              style={{ background: 'var(--nafa-white)', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}
            >
              {reviewsList}
            </motion.div>
          </div>

          {/* Right main — products */}
          <div className="flex-1 min-w-0">
            {/* Cover banner */}
            <motion.div
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              className="relative rounded-3xl overflow-hidden mb-6"
              style={{ height: 160, background: 'linear-gradient(135deg, var(--nafa-orange) 0%, #7c2d12 100%)' }}
            >
              <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="absolute right-24 -bottom-8 w-40 h-40 rounded-full" style={{ background: 'rgba(0,0,0,0.08)' }} />
              <div className="absolute inset-0 flex items-end px-8 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold tracking-widest uppercase text-white/70">Boutique</span>
                    {vendor.isVerified && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'rgba(255,255,255,0.2)' }}>
                        Vérifié ✓
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-white">{vendor.shopName}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <StatPill value={products.length} label="produits" />
                    <span className="text-white/40 text-xs">|</span>
                    <StatPill value={vendor.totalSales.toLocaleString('fr-FR')} label="ventes" />
                    <span className="text-white/40 text-xs">|</span>
                    <StatPill value={followerCount.toLocaleString('fr-FR')} label="abonnés" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Products heading */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: 'var(--nafa-black)' }}>
                Tous les produits
                {products.length > 0 && (
                  <span className="ml-2 text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--nafa-gray-200)', color: 'var(--nafa-gray-700)' }}>
                    {products.length}
                  </span>
                )}
              </h3>
            </div>

            {products.length === 0 ? (
              <EmptyState icon={Package} title="Aucun produit" description="Cette boutique n'a pas encore de produits disponibles." />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product, i) => (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <ProductCard product={product} index={i} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
