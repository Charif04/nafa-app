'use client';
import { useState, useEffect, use, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ShoppingCart, Zap, Star, Heart, Package, ChevronRight, Truck, ShieldCheck, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency, clientPrice, formatRelativeTime } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import { useUiStore } from '@/stores/uiStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { RatingStars } from '@/components/shared/RatingStars';
import type { Product } from '@/types';

interface ProductReview {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Slide direction variants
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%' }),
  center: { x: 0 },
  exit:  (dir: number) => ({ x: dir < 0 ? '100%' : '-100%' }),
};

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [direction, setDirection] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const dragX = useMotionValue(0);
  const dragOpacity = useTransform(dragX, [-80, 0, 80], [0.6, 1, 0.6]);
  const dragStartX = useRef(0);

  const addItem = useCartStore((s) => s.addItem);
  const currency = useUiStore((s) => s.currency);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isFav = useWishlistStore((s) => product ? s.items.some((p) => p.id === product.id) : false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: row } = await (supabase as any)
        .from('products')
        .select(`*, vendor:profiles!products_vendor_id_fkey(vendor_profiles(shop_name))`)
        .eq('id', id).eq('is_active', true).maybeSingle();

      if (row) {
        const vp = Array.isArray(row.vendor?.vendor_profiles)
          ? row.vendor.vendor_profiles[0]
          : row.vendor?.vendor_profiles;
        setProduct({
          id: row.id, vendorId: row.vendor_id, vendorName: vp?.shop_name ?? '',
          title: row.title, description: row.description ?? '',
          price: Number(row.price), currency: row.currency,
          images: row.images ?? [], category: row.category ?? '',
          stock: row.stock, rating: Number(row.rating),
          reviewCount: row.review_count, createdAt: row.created_at, updatedAt: row.updated_at,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: revData } = await (supabase as any)
          .from('reviews')
          .select(`id, rating, comment, created_at, reviewer:profiles!reviews_from_user_id_fkey(first_name, last_name)`)
          .eq('to_user_id', row.vendor_id).eq('type', 'client_to_vendor')
          .order('created_at', { ascending: false }).limit(5);

        if (revData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setReviews(revData.map((r: any) => ({
            id: r.id,
            reviewerName: r.reviewer ? `${r.reviewer.first_name} ${r.reviewer.last_name}`.trim() : 'Client',
            rating: r.rating, comment: r.comment ?? '', createdAt: r.created_at,
          })));
        }
      }
      setIsLoading(false);
    }
    load();
  }, [id]);

  const goTo = (next: number) => {
    if (!product || next === activeImg) return;
    setDirection(next > activeImg ? 1 : -1);
    setActiveImg(next);
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (!product) return;
    if (info.offset.x < -50 && activeImg < product.images.length - 1) goTo(activeImg + 1);
    else if (info.offset.x > 50 && activeImg > 0) goTo(activeImg - 1);
    dragX.set(0);
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({ productId: product.id, title: product.title, price: product.price, image: product.images[0] ?? '', quantity, vendorId: product.vendorId, vendorName: product.vendorName, stock: product.stock });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2200);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem({ productId: product.id, title: product.title, price: product.price, image: product.images[0] ?? '', quantity, vendorId: product.vendorId, vendorName: product.vendorName, stock: product.stock });
    router.push('/checkout');
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-dvh bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--nafa-gray-100)', paddingTop: 'calc(env(safe-area-inset-top,0px) + 12px)' }}>
          <div className="w-9 h-9 rounded-full animate-pulse bg-gray-100" />
          <div className="w-24 h-4 rounded animate-pulse bg-gray-100" />
          <div className="w-9 h-9 rounded-full animate-pulse bg-gray-100" />
        </div>
        <div className="aspect-square animate-pulse bg-gray-100" />
        <div className="px-5 py-5 space-y-4">
          {[70, 50, 40, 90, 55].map((w, i) => (
            <div key={i} className="h-4 rounded-xl animate-pulse bg-gray-100" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-8 bg-white">
        <div className="text-center">
          <Package size={48} strokeWidth={1.25} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--nafa-black)' }}>Produit introuvable</h2>
          <button onClick={() => router.push('/home')} className="text-sm font-semibold" style={{ color: 'var(--nafa-orange)' }}>
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  const displayPrice = clientPrice(product.price);
  const images = product.images.length > 0 ? product.images : [''];

  return (
    <div className="min-h-dvh bg-white" style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}>

      {/* ── Header — ABOVE image, never overlapping ── */}
      <header
        className="flex items-center justify-between px-4 bg-white border-b"
        style={{ borderColor: 'var(--nafa-gray-100)', paddingTop: 'calc(env(safe-area-inset-top,0px) + 10px)', paddingBottom: 10 }}
      >
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'var(--nafa-gray-100)' }}>
          <ChevronLeft size={20} strokeWidth={2} style={{ color: 'var(--nafa-black)' }} />
        </motion.button>

        <span className="text-sm font-semibold truncate mx-4 flex-1 text-center"
          style={{ color: 'var(--nafa-gray-400)' }}>
          {product.category || 'Produit'}
        </span>

        <motion.button whileTap={{ scale: 0.88 }}
          onClick={() => toggleWishlist(product)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: isFav ? 'rgba(239,68,68,0.08)' : 'var(--nafa-gray-100)' }}>
          <Heart size={18} strokeWidth={1.75}
            className={isFav ? 'fill-red-500 text-red-500' : ''}
            style={!isFav ? { color: 'var(--nafa-gray-700)' } : undefined} />
        </motion.button>
      </header>

      {/* ── Image carousel — swipeable ── */}
      <div className="relative overflow-hidden select-none" style={{ aspectRatio: '1/1', background: '#f8f8f8' }}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={activeImg}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ opacity: dragOpacity }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragStart={(_, info) => { dragStartX.current = info.point.x; }}
            onDragEnd={handleDragEnd}
            onDrag={(_, info) => dragX.set(info.offset.x)}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            {images[activeImg] ? (
              <Image
                src={images[activeImg]}
                alt={`${product.title} ${activeImg + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                className="object-contain pointer-events-none"
                priority={activeImg === 0}
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package size={72} strokeWidth={0.75} className="text-gray-200" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next tap zones (invisible) */}
        {activeImg > 0 && (
          <button onClick={() => goTo(activeImg - 1)}
            className="absolute left-0 top-0 bottom-0 w-12 z-10" aria-label="Image précédente" />
        )}
        {activeImg < images.length - 1 && (
          <button onClick={() => goTo(activeImg + 1)}
            className="absolute right-0 top-0 bottom-0 w-12 z-10" aria-label="Image suivante" />
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {images.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => goTo(i)}
                animate={{ width: i === activeImg ? 20 : 6, opacity: i === activeImg ? 1 : 0.4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="h-1.5 rounded-full"
                style={{ background: 'var(--nafa-orange)' }}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto" style={{ borderBottom: '1px solid var(--nafa-gray-100)' }}>
          {images.map((img, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.93 }}
              onClick={() => goTo(i)}
              className="flex-shrink-0 rounded-xl overflow-hidden"
              style={{
                width: 56, height: 56,
                border: `2px solid ${i === activeImg ? 'var(--nafa-orange)' : 'transparent'}`,
                outline: i === activeImg ? 'none' : '1px solid var(--nafa-gray-200)',
                outlineOffset: i === activeImg ? 0 : -1,
                opacity: i === activeImg ? 1 : 0.55,
                transition: 'opacity 0.2s, border-color 0.2s',
              }}
              aria-label={`Image ${i + 1}`}
            >
              {img && <Image src={img} alt="" width={56} height={56} className="object-cover w-full h-full" draggable={false} />}
            </motion.button>
          ))}
        </div>
      )}

      {/* ── Product info ── */}
      <div className="px-5 py-5 space-y-5">

        {/* Title */}
        <div>
          <h1 className="text-xl font-bold leading-snug" style={{ color: 'var(--nafa-black)' }}>
            {product.title}
          </h1>
          <div className="flex items-center justify-between mt-2">
            <RatingStars rating={product.rating} showValue reviewCount={product.reviewCount} />
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: product.stock > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                color: product.stock > 0 ? '#16a34a' : '#dc2626',
              }}>
              {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}
            </span>
          </div>
        </div>

        {/* Price + quantity */}
        <div className="flex items-center justify-between rounded-2xl px-4 py-3.5"
          style={{ background: 'rgba(255,107,44,0.06)', border: '1px solid rgba(255,107,44,0.12)' }}>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
              style={{ color: 'var(--nafa-orange)', opacity: 0.7 }}>Prix</p>
            <p className="text-3xl font-black nafa-mono leading-none" style={{ color: 'var(--nafa-orange)' }}>
              {formatCurrency(displayPrice, currency)}
            </p>
          </div>
          <div className="flex items-center rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,107,44,0.2)', background: 'white' }}>
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}
              className="w-10 h-10 flex items-center justify-center text-xl font-bold disabled:opacity-25 transition-opacity"
              style={{ color: 'var(--nafa-orange)' }}>−</button>
            <span className="w-8 text-center text-base font-bold nafa-mono" style={{ color: 'var(--nafa-black)' }}>
              {quantity}
            </span>
            <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock}
              className="w-10 h-10 flex items-center justify-center text-xl font-bold text-white disabled:opacity-25 transition-opacity"
              style={{ background: 'var(--nafa-orange)' }}>+</button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: 'var(--nafa-gray-100)' }}>
            <Truck size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--nafa-black)' }}>Livraison NAFA</p>
              <p className="text-[10px]" style={{ color: 'var(--nafa-gray-400)' }}>Suivi en temps réel</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: 'var(--nafa-gray-100)' }}>
            <ShieldCheck size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--nafa-black)' }}>Paiement sécurisé</p>
              <p className="text-[10px]" style={{ color: 'var(--nafa-gray-400)' }}>100% protégé</p>
            </div>
          </div>
        </div>

        {/* Vendor */}
        <Link href={`/vendor/${product.vendorId}`}
          className="flex items-center justify-between p-4 rounded-2xl transition-colors"
          style={{ background: 'var(--nafa-gray-100)' }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
              style={{ background: 'var(--nafa-orange)' }}>
              {product.vendorName?.[0]?.toUpperCase() ?? 'V'}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>{product.vendorName}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-orange)' }}>Voir la boutique</p>
            </div>
          </div>
          <ChevronRight size={16} strokeWidth={2} style={{ color: 'var(--nafa-gray-400)' }} />
        </Link>

        {/* Description */}
        {product.description && (
          <div>
            <h2 className="text-sm font-bold mb-2.5" style={{ color: 'var(--nafa-black)' }}>À propos du produit</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--nafa-gray-700)' }}>
              {product.description}
            </p>
          </div>
        )}

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>
              Avis clients
              {product.reviewCount > 0 && (
                <span className="ml-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}>
                  {product.reviewCount}
                </span>
              )}
            </h2>
            {product.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star size={13} strokeWidth={0} className="fill-[var(--nafa-orange)]" />
                <span className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>
                  {product.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--nafa-gray-400)' }}>
              Soyez le premier à laisser un avis.
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 rounded-2xl" style={{ background: 'var(--nafa-gray-100)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--nafa-black)' }}>
                      {review.reviewerName}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }} suppressHydrationWarning>
                      {formatRelativeTime(review.createdAt)}
                    </span>
                  </div>
                  <RatingStars rating={review.rating} size={12} />
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--nafa-gray-700)' }}>
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex gap-3 pt-2">
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all"
            style={{
              borderColor: addedToCart ? '#22c55e' : 'var(--nafa-orange)',
              color: addedToCart ? 'white' : 'var(--nafa-orange)',
              background: addedToCart ? '#22c55e' : 'transparent',
            }}>
            {addedToCart ? <><Check size={16} strokeWidth={2.5} /> Ajouté au panier</> : <><ShoppingCart size={16} strokeWidth={1.75} /> Ajouter au panier</>}
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleBuyNow}
            disabled={product.stock === 0}
            className="flex-1 py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
            style={{ background: product.stock > 0 ? 'var(--nafa-orange)' : 'var(--nafa-gray-300)' }}>
            <Zap size={16} strokeWidth={1.75} /> Acheter maintenant
          </motion.button>
        </div>
      </div>

      {/* ── Mobile sticky CTA ── */}
      <div
        className="fixed left-0 right-0 px-4 pt-3 pb-3 lg:hidden z-30"
        style={{
          bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--nafa-gray-100)',
        }}
      >
        <div className="flex gap-3">
          <motion.button whileTap={{ scale: 0.96 }} onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all"
            style={{
              borderColor: addedToCart ? '#22c55e' : 'var(--nafa-orange)',
              color: addedToCart ? 'white' : 'var(--nafa-orange)',
              background: addedToCart ? '#22c55e' : 'transparent',
            }}>
            {addedToCart
              ? <><Check size={16} strokeWidth={2.5} /> Ajouté !</>
              : <><ShoppingCart size={16} strokeWidth={1.75} /> Panier</>}
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={handleBuyNow}
            disabled={product.stock === 0}
            className="flex-1 py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
            style={{ background: product.stock > 0 ? 'var(--nafa-orange)' : 'var(--nafa-gray-300)' }}>
            <Zap size={16} strokeWidth={1.75} /> Acheter
          </motion.button>
        </div>
      </div>

    </div>
  );
}
