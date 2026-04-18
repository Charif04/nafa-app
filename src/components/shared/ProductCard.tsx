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
    setTimeout(() => setAdding(false), 1200);
  };

  const displayPrice = formatCurrency(clientPrice(product.price), currency);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn('group bg-white rounded-2xl overflow-hidden flex flex-col', className)}
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)' }}
    >
      <Link href={`/product/${product.id}`} className="block relative">
        {/* Image */}
        <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: '3/4' }}>
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
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }}>
              <ShoppingCart size={32} strokeWidth={1} style={{ color: 'var(--nafa-gray-300)' }} />
            </div>
          )}

          {/* Gradient overlay bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.22), transparent)' }} />

          {/* Wishlist */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => { e.preventDefault(); toggle(product); }}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(6px)' }}
            aria-label={wishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart
              size={14}
              strokeWidth={2}
              className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500'}
            />
          </motion.button>

          {/* Out of stock badge */}
          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.45)' }}>
              <span className="text-white text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                Rupture
              </span>
            </div>
          )}

          {/* Price tag at bottom-left */}
          <div className="absolute bottom-2.5 left-2.5">
            <span className="text-white text-sm font-black nafa-mono px-2 py-0.5 rounded-lg"
              style={{ background: 'var(--nafa-orange)', boxShadow: '0 2px 8px rgba(255,107,44,0.4)' }}>
              {displayPrice}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="px-3 pt-2.5 pb-1">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2"
            style={{ color: 'var(--nafa-black)', minHeight: '2.5rem' }}>
            {product.title}
          </h3>
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-1">
              <Star size={11} strokeWidth={2} className="fill-[var(--nafa-orange)] text-[var(--nafa-orange)]" />
              <span className="text-xs font-semibold" style={{ color: 'var(--nafa-gray-700)' }}>
                {product.rating > 0 ? product.rating.toFixed(1) : '—'}
              </span>
              {product.reviewCount > 0 && (
                <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>
                  ({product.reviewCount})
                </span>
              )}
            </div>
            {product.vendorName && (
              <span className="text-xs truncate max-w-[90px]" style={{ color: 'var(--nafa-gray-400)' }}>
                {product.vendorName}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to cart */}
      <div className="px-3 pb-3 pt-1 mt-auto">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          style={{
            background: adding
              ? '#22c55e'
              : product.stock === 0
              ? 'var(--nafa-gray-200)'
              : 'var(--nafa-orange)',
            color: product.stock === 0 ? 'var(--nafa-gray-400)' : 'white',
          }}
          aria-label={`Ajouter ${product.title} au panier`}
        >
          {adding ? (
            <><Check size={14} strokeWidth={2.5} /> Ajouté</>
          ) : (
            <><ShoppingCart size={14} strokeWidth={1.75} /> {product.stock === 0 ? 'Indisponible' : 'Ajouter'}</>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
