'use client';
import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ShoppingCart, Zap, Star, Heart, Package, ChevronRight, Truck, ShieldCheck } from 'lucide-react';
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

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
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
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (row) {
        const vp = Array.isArray(row.vendor?.vendor_profiles)
          ? row.vendor.vendor_profiles[0]
          : row.vendor?.vendor_profiles;
        const prod: Product = {
          id: row.id,
          vendorId: row.vendor_id,
          vendorName: vp?.shop_name ?? '',
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
        };
        setProduct(prod);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: revData } = await (supabase as any)
          .from('reviews')
          .select(`id, rating, comment, created_at, reviewer:profiles!reviews_from_user_id_fkey(first_name, last_name)`)
          .eq('to_user_id', row.vendor_id)
          .eq('type', 'client_to_vendor')
          .order('created_at', { ascending: false })
          .limit(5);

        if (revData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setReviews(revData.map((r: any) => ({
            id: r.id,
            reviewerName: r.reviewer ? `${r.reviewer.first_name} ${r.reviewer.last_name}`.trim() : 'Client',
            rating: r.rating,
            comment: r.comment ?? '',
            createdAt: r.created_at,
          })));
        }
      }
      setIsLoading(false);
    }
    load();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({ productId: product.id, title: product.title, price: product.price, image: product.images[0] ?? '', quantity, vendorId: product.vendorId, vendorName: product.vendorName, stock: product.stock });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem({ productId: product.id, title: product.title, price: product.price, image: product.images[0] ?? '', quantity, vendorId: product.vendorId, vendorName: product.vendorName, stock: product.stock });
    router.push('/checkout');
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh" style={{ background: 'var(--nafa-white)' }}>
        <div className="h-[55vw] max-h-[420px] animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
        <div className="px-4 py-5 space-y-4">
          {[80, 60, 40, 100, 60].map((w, i) => (
            <div key={i} className="h-5 rounded-xl animate-pulse" style={{ background: 'var(--nafa-gray-200)', width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-8" style={{ background: 'var(--nafa-white)' }}>
        <div className="text-center">
          <Package size={48} strokeWidth={1.25} style={{ color: 'var(--nafa-gray-400)' }} className="mx-auto mb-4" />
          <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--nafa-black)' }}>Produit introuvable</h2>
          <button onClick={() => router.push('/home')} className="text-sm font-semibold mt-2" style={{ color: 'var(--nafa-orange)' }}>
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  const displayPrice = clientPrice(product.price);

  return (
    <div className="min-h-dvh lg:pb-8" style={{ background: 'var(--nafa-gray-100)', paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))' }}>

      {/* ── Image section ── */}
      <div className="relative bg-white">
        {/* Back + wishlist — float above image */}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 z-10"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 6px rgba(0,0,0,0.12)' }}>
            <ChevronLeft size={20} strokeWidth={2} style={{ color: 'var(--nafa-black)' }} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => { if (product) toggleWishlist(product); }}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 6px rgba(0,0,0,0.12)' }}>
            <Heart size={18} strokeWidth={1.75}
              className={isFav ? 'fill-red-500 text-red-500' : ''}
              style={!isFav ? { color: 'var(--nafa-gray-700)' } : undefined} />
          </motion.button>
        </div>

        {/* Main image */}
        <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: '1/1' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeImg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} className="absolute inset-0">
              {product.images[activeImg] ? (
                <Image src={product.images[activeImg]} alt={product.title} fill
                  sizes="(max-width: 640px) 100vw, 640px" className="object-cover" priority={activeImg === 0} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <Package size={64} strokeWidth={1} style={{ color: 'var(--nafa-gray-400)' }} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Image counter */}
          {product.images.length > 1 && (
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(0,0,0,0.4)', color: 'white' }}>
              {activeImg + 1} / {product.images.length}
            </div>
          )}
        </div>

        {/* Thumbnail strip — white background */}
        {product.images.length > 1 && (
          <div className="flex gap-2 px-4 py-3 bg-white border-b" style={{ borderColor: 'var(--nafa-gray-100)' }}>
            {product.images.map((img, i) => (
              <button key={i} onClick={() => setActiveImg(i)}
                className="flex-shrink-0 rounded-xl overflow-hidden transition-all"
                style={{
                  width: 58, height: 58,
                  border: `2px solid ${i === activeImg ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)'}`,
                }}>
                <Image src={img} alt="" width={58} height={58} className="object-cover w-full h-full" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="px-4 pt-5 pb-4 space-y-5 bg-white">

        {/* Title + stock */}
        <div>
          {product.category && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full mb-2 inline-block"
              style={{ background: 'rgba(255,107,44,0.1)', color: 'var(--nafa-orange)' }}>
              {product.category}
            </span>
          )}
          <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--nafa-black)' }}>
            {product.title}
          </h1>
          <div className="flex items-center justify-between mt-2">
            <RatingStars rating={product.rating} showValue reviewCount={product.reviewCount} />
            <span className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                background: product.stock > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                color: product.stock > 0 ? '#16a34a' : '#dc2626',
              }}>
              {product.stock > 0 ? `${product.stock} en stock` : 'Rupture'}
            </span>
          </div>
        </div>

        {/* Price + quantity */}
        <div className="flex items-center justify-between py-3 px-4 rounded-2xl"
          style={{ background: 'var(--nafa-gray-100)' }}>
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--nafa-gray-400)' }}>Prix</p>
            <span className="text-3xl font-black nafa-mono" style={{ color: 'var(--nafa-orange)' }}>
              {formatCurrency(displayPrice, currency)}
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-xl px-1 py-1"
            style={{ background: 'var(--nafa-white)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xl font-bold disabled:opacity-30"
              style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-black)' }}>−</button>
            <span className="w-7 text-center text-base font-bold nafa-mono" style={{ color: 'var(--nafa-black)' }}>
              {quantity}
            </span>
            <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xl font-bold text-white disabled:opacity-30"
              style={{ background: 'var(--nafa-orange)' }}>+</button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'var(--nafa-gray-100)' }}>
            <Truck size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--nafa-gray-700)' }}>Livraison NAFA</p>
          </div>
          <div className="flex-1 flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'var(--nafa-gray-100)' }}>
            <ShieldCheck size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--nafa-gray-700)' }}>Achat sécurisé</p>
          </div>
        </div>

        {/* Vendor */}
        <Link href={`/vendor/${product.vendorId}`}
          className="flex items-center justify-between p-3.5 rounded-2xl"
          style={{ border: '1px solid var(--nafa-gray-200)', background: 'var(--nafa-white)' }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold"
              style={{ background: 'var(--nafa-orange)', fontSize: 16 }}>
              {product.vendorName?.[0]?.toUpperCase() ?? 'V'}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>{product.vendorName}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-orange)' }}>Voir la boutique →</p>
            </div>
          </div>
          <ChevronRight size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
        </Link>

        {/* Description */}
        {product.description && (
          <div>
            <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--nafa-black)' }}>Description</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--nafa-gray-700)' }}>
              {product.description}
            </p>
          </div>
        )}

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>
              Avis clients ({product.reviewCount})
            </h2>
            {product.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star size={13} strokeWidth={2} className="fill-[var(--nafa-orange)] text-[var(--nafa-orange)]" />
                <span className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>
                  {product.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
          {reviews.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--nafa-gray-400)' }}>
              Aucun avis pour le moment.
            </p>
          ) : (
            <div className="space-y-2.5">
              {reviews.map((review) => (
                <div key={review.id} className="p-3.5 rounded-2xl" style={{ background: 'var(--nafa-gray-100)' }}>
                  <div className="flex items-center justify-between mb-1.5">
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
            disabled={product.stock === 0 || addedToCart}
            className="flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all"
            style={{
              borderColor: 'var(--nafa-orange)',
              color: addedToCart ? 'white' : 'var(--nafa-orange)',
              background: addedToCart ? 'var(--nafa-orange)' : 'transparent',
            }}>
            <ShoppingCart size={16} strokeWidth={1.75} />
            {addedToCart ? 'Ajouté au panier !' : 'Ajouter au panier'}
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleBuyNow} disabled={product.stock === 0}
            className="flex-1 py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
            style={{ background: product.stock > 0 ? 'var(--nafa-orange)' : 'var(--nafa-gray-400)' }}>
            <Zap size={16} strokeWidth={1.75} />
            Acheter maintenant
          </motion.button>
        </div>
      </div>

      {/* ── Mobile sticky CTA ── */}
      <div className="fixed left-0 right-0 px-4 pt-4 pb-3 lg:hidden"
        style={{
          bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
          background: 'linear-gradient(to top, var(--nafa-white) 75%, transparent)',
          zIndex: 30,
        }}>
        <div className="flex gap-3">
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddToCart}
            disabled={product.stock === 0 || addedToCart}
            className="flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all"
            style={{
              borderColor: addedToCart ? '#22c55e' : 'var(--nafa-orange)',
              color: addedToCart ? 'white' : 'var(--nafa-orange)',
              background: addedToCart ? '#22c55e' : 'transparent',
            }}>
            <ShoppingCart size={16} strokeWidth={1.75} />
            {addedToCart ? 'Ajouté !' : 'Panier'}
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleBuyNow} disabled={product.stock === 0}
            className="flex-1 py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
            style={{ background: product.stock > 0 ? 'var(--nafa-orange)' : 'var(--nafa-gray-400)' }}>
            <Zap size={16} strokeWidth={1.75} />
            Acheter
          </motion.button>
        </div>
      </div>
    </div>
  );
}
