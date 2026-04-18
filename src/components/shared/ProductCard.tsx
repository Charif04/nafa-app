'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Heart, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatCurrency, clientPrice } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import { useUiStore } from '@/stores/uiStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { Skeleton } from './SkeletonShimmer';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  index?: number;
  className?: string;
}

export function ProductCard({ product, index = 0, className }: ProductCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const currency = useUiStore((s) => s.currency);
  const addItem = useCartStore((s) => s.addItem);
  const toggle = useWishlistStore((s) => s.toggle);
  const wishlisted = useWishlistStore((s) => s.items.some((p) => p.id === product.id));

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock === 0 || adding) return;
    setAdding(true);
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.images[0] ?? '',
      quantity: 1,
      vendorId: product.vendorId,
      vendorName: product.vendorName,
      stock: product.stock,
    });
    setTimeout(() => setAdding(false), 1400);
  };

  const displayPrice = formatCurrency(clientPrice(product.price), currency);
  const outOfStock = product.stock === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn('bg-white rounded-2xl overflow-hidden flex flex-col', className)}
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
    >
      {/* Image */}
      <Link href={`/product/${product.id}`} className="block relative flex-shrink-0">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {!imgLoaded && <Skeleton className="absolute inset-0 w-full h-full" rounded={false} />}
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                'object-cover transition-transform duration-500 group-hover:scale-105',
                imgLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImgLoaded(true)}
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <ShoppingCart size={28} strokeWidth={1} className="text-gray-300" />
            </div>
          )}

          {/* Wishlist */}
          <motion.button
            whileTap={{ scale: 0.82 }}
            onClick={(e) => { e.preventDefault(); toggle(product); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-sm"
            style={{ background: 'rgba(255,255,255,0.92)' }}
            aria-label={wishlisted ? 'Retirer' : 'Favoris'}
          >
            <Heart size={13} strokeWidth={2}
              className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
          </motion.button>

          {/* Out of stock */}
          {outOfStock && (
            <div className="absolute inset-0 flex items-end justify-center pb-3"
              style={{ background: 'rgba(0,0,0,0.3)' }}>
              <span className="text-white text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/60">
                Rupture
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-2.5 gap-1.5">
        <Link href={`/product/${product.id}`}>
          <h3 className="text-[13px] font-semibold leading-snug line-clamp-2"
            style={{ color: 'var(--nafa-black)' }}>
            {product.title}
          </h3>
        </Link>

        {/* Rating — only show when there are real reviews */}
        <div className="flex items-center gap-1" style={{ minHeight: 16 }}>
          {product.reviewCount > 0 ? (
            <>
              <Star size={11} strokeWidth={0} className="fill-[var(--nafa-orange)]" />
              <span className="text-[11px] font-medium" style={{ color: 'var(--nafa-gray-700)' }}>
                {product.rating.toFixed(1)}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--nafa-gray-400)' }}>
                ({product.reviewCount})
              </span>
            </>
          ) : (
            <span className="text-[10px]" style={{ color: 'var(--nafa-gray-400)' }}>Nouveau</span>
          )}
        </div>

        {/* Price + cart button */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <p className="text-sm font-black nafa-mono" style={{ color: 'var(--nafa-orange)' }}>
            {displayPrice}
          </p>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
            style={{
              background: adding ? '#22c55e' : outOfStock ? 'var(--nafa-gray-200)' : 'var(--nafa-orange)',
            }}
            aria-label="Ajouter au panier"
          >
            {adding
              ? <Check size={13} strokeWidth={2.5} className="text-white" />
              : <ShoppingCart size={13} strokeWidth={1.75} className="text-white" />
            }
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
