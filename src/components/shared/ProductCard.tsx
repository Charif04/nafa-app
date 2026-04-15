'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, MapPin, Star, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatCurrency, clientPrice } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import { useUiStore } from '@/stores/uiStore';
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
  const [wishlisted, setWishlisted] = useState(false);
  const currency = useUiStore((s) => s.currency);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
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
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.02, translateY: -2 }}
      className={cn(
        'group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100',
        className
      )}
    >
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {!imgLoaded && <Skeleton className="absolute inset-0 w-full h-full" rounded={false} />}
          {product.images[0] && (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn('object-cover transition-all duration-500 group-hover:scale-105', imgLoaded ? 'opacity-100' : 'opacity-0')}
              onLoad={() => setImgLoaded(true)}
              loading="lazy"
            />
          )}
          {/* Wishlist button */}
          <button
            onClick={(e) => { e.preventDefault(); setWishlisted((w) => !w); }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-90"
            style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}
            aria-label={wishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart
              size={15}
              strokeWidth={1.75}
              className={wishlisted ? 'fill-red-500 text-red-500' : ''}
              style={wishlisted ? undefined : { color: 'var(--nafa-gray-700)' }}
            />
          </button>
        </div>

        <div className="p-3 sm:p-4">
          <h3
            className="text-sm font-medium leading-tight line-clamp-2 mb-1.5"
            style={{ color: 'var(--nafa-gray-900)' }}
          >
            {product.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-1.5">
            <Star size={12} strokeWidth={1.75} className="fill-[var(--nafa-orange)] text-[var(--nafa-orange)]" />
            <span className="text-xs font-medium" style={{ color: 'var(--nafa-gray-700)' }}>
              {product.rating.toFixed(1)}
            </span>
            <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>
              ({product.reviewCount})
            </span>
          </div>

          {/* Price */}
          <p className="text-base font-bold nafa-mono mb-2" style={{ color: 'var(--nafa-black)' }}>
            {formatCurrency(clientPrice(product.price), currency)}
          </p>

          {/* Vendor */}
          {product.vendorName && (
            <div className="flex items-center gap-1 mb-3">
              <MapPin size={11} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
              <span className="text-xs truncate" style={{ color: 'var(--nafa-gray-700)' }}>
                {product.vendorName}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Add to cart button */}
      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={cn(
            'w-full py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200',
            product.stock === 0
              ? 'opacity-40 cursor-not-allowed'
              : 'text-white hover:opacity-90 active:opacity-80'
          )}
          style={product.stock > 0 ? { background: 'var(--nafa-orange)' } : { background: 'var(--nafa-gray-400)' }}
          aria-label={`Ajouter ${product.title} au panier`}
        >
          <motion.div
            animate={adding ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ShoppingCart size={14} strokeWidth={1.75} />
          </motion.div>
          {product.stock === 0 ? 'Rupture de stock' : 'Ajouter'}
        </motion.button>
      </div>
    </motion.div>
  );
}
