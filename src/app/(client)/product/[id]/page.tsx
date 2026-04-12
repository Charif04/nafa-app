'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ShoppingCart, Zap, Star, MapPin, Heart, ChevronRight, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency, clientPrice } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import { RatingStars } from '@/components/shared/RatingStars';
import { Logo } from '@/components/shared/Logo';
import type { Product } from '@/types';

// Mock product detail
const MOCK_PRODUCT: Product = {
  id: 'product-1',
  vendorId: 'v1',
  vendorName: 'Boutique Aminata',
  title: 'Boubou brodé traditionnel',
  description: 'Magnifique boubou traditionnel en coton de haute qualité, brodé à la main par des artisans sénégalais. Ce vêtement élégant est parfait pour les cérémonies et occasions spéciales. La broderie fine et les couleurs vives reflètent le savoir-faire artisanal africain transmis de génération en génération.',
  price: 12000,
  currency: 'FCFA',
  images: [
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1590736969596-4f76c1e1ff34?w=600&h=600&fit=crop',
  ],
  category: 'fashion',
  stock: 5,
  rating: 4.8,
  reviewCount: 124,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const MOCK_REVIEWS = [
  { id: '1', name: 'Fatou N.', rating: 5, comment: 'Qualité exceptionnelle, conforme à la description. Livraison rapide!', date: 'Il y a 2 jours' },
  { id: '2', name: 'Ibrahim K.', rating: 4, comment: 'Très beau boubou, broderie soignée. Je recommande.', date: 'Il y a 1 semaine' },
  { id: '3', name: 'Aissatou B.', rating: 5, comment: 'Parfait pour une cérémonie. Tout le monde a adoré!', date: 'Il y a 2 semaines' },
];

export default function ProductDetailPage() {
  const router = useRouter();
  const [activeImg, setActiveImg] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const product = MOCK_PRODUCT;

  const displayPrice = clientPrice(product.price);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.images[0] ?? '',
      quantity,
      vendorId: product.vendorId,
      stock: product.stock,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.images[0] ?? '',
      quantity,
      vendorId: product.vendorId,
      stock: product.stock,
    });
    router.push('/checkout');
  };

  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-white)' }}>
      {/* Header */}
      <header className="sticky top-0 md:top-16 z-20 flex items-center justify-between px-4 py-3 max-w-5xl mx-auto"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)' }}>
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'var(--nafa-gray-100)' }}
          aria-label="Retour"
        >
          <ChevronLeft size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-black)' }} />
        </button>
        <Logo size="sm" />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsFav(!isFav)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'var(--nafa-gray-100)' }}
          aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart
            size={18}
            strokeWidth={1.75}
            className={isFav ? 'fill-red-500 text-red-500' : ''}
            style={!isFav ? { color: 'var(--nafa-gray-700)' } : undefined}
          />
        </motion.button>
      </header>

      {/* Main content wrapper */}
      <div className="max-w-5xl mx-auto">
      {/* Two-column layout on desktop */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start lg:px-4">

      {/* Image carousel */}
      <div className="relative">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeImg}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <Image
                src={product.images[activeImg] ?? ''}
                alt={`${product.title} - image ${activeImg + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                className="object-cover"
                priority={activeImg === 0}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {product.images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className="transition-all rounded-full"
              style={{
                width: i === activeImg ? 20 : 6,
                height: 6,
                background: i === activeImg ? 'var(--nafa-orange)' : 'rgba(255,255,255,0.7)',
              }}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>

        {/* Thumbnail row */}
        {product.images.length > 1 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className="w-12 h-12 rounded-xl overflow-hidden border-2 transition-all"
                style={{ borderColor: i === activeImg ? 'var(--nafa-orange)' : 'transparent' }}
                aria-label={`Voir image ${i + 1}`}
              >
                <Image src={img} alt="" width={48} height={48} className="object-cover w-full h-full" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="px-4 py-6 space-y-5"
      >
        {/* Title + rating */}
        <div>
          <h1 className="text-xl font-bold leading-tight mb-2" style={{ color: 'var(--nafa-black)' }}>
            {product.title}
          </h1>
          <div className="flex items-center justify-between">
            <RatingStars rating={product.rating} showValue reviewCount={product.reviewCount} />
            <div className="flex items-center gap-1.5">
              <Package size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
              <span className="text-xs" style={{ color: 'var(--nafa-gray-700)' }}>
                {product.stock > 0 ? `${product.stock} en stock` : 'Rupture'}
              </span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-3xl font-black nafa-mono" style={{ color: 'var(--nafa-orange)' }}>
            {formatCurrency(displayPrice, product.currency)}
          </span>
          {/* Quantity selector */}
          <div className="flex items-center gap-2 rounded-xl border p-1" style={{ borderColor: 'var(--nafa-gray-200)' }}>
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-colors disabled:opacity-30"
              style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-black)' }}
              aria-label="Diminuer la quantité"
            >−</button>
            <span className="w-6 text-center text-sm font-bold nafa-mono" style={{ color: 'var(--nafa-black)' }}>{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              disabled={quantity >= product.stock}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-colors disabled:opacity-30"
              style={{ background: 'var(--nafa-orange)', color: 'white' }}
              aria-label="Augmenter la quantité"
            >+</button>
          </div>
        </div>

        {/* Vendor */}
        <Link
          href={`/vendor/${product.vendorId}`}
          className="flex items-center justify-between p-3 rounded-2xl border"
          style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'var(--nafa-orange)' }}
            >
              {product.vendorName?.[0] ?? 'V'}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--nafa-black)' }}>{product.vendorName}</p>
              <div className="flex items-center gap-1">
                <MapPin size={11} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                <p className="text-xs" style={{ color: 'var(--nafa-gray-700)' }}>Voir la boutique</p>
              </div>
            </div>
          </div>
          <ChevronRight size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
        </Link>

        {/* Description */}
        <div>
          <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--nafa-gray-900)' }}>Description</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--nafa-gray-700)' }}>
            {product.description}
          </p>
        </div>

        {/* Inline buttons on lg+ */}
        <div className="hidden lg:flex gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ translateY: -1 }}
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addedToCart}
            className="flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border-2 transition-all"
            style={{
              borderColor: 'var(--nafa-orange)',
              color: addedToCart ? 'var(--nafa-white)' : 'var(--nafa-orange)',
              background: addedToCart ? 'var(--nafa-orange)' : 'transparent',
            }}
          >
            <ShoppingCart size={16} strokeWidth={1.75} />
            {addedToCart ? 'Ajouté !' : 'Panier'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ translateY: -1 }}
            onClick={handleBuyNow}
            disabled={product.stock === 0}
            className="flex-1 py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
            style={{ background: product.stock > 0 ? 'var(--nafa-orange)' : 'var(--nafa-gray-400)' }}
          >
            <Zap size={16} strokeWidth={1.75} />
            Acheter
          </motion.button>
        </div>
      </motion.div>

      </div>{/* end lg:grid */}

      {/* Reviews section — full width below columns */}
      <div className="px-4 pb-32 lg:pb-8 space-y-3 mt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--nafa-gray-900)' }}>
            Avis clients ({product.reviewCount})
          </h2>
          <div className="flex items-center gap-1">
            <Star size={14} strokeWidth={1.75} className="fill-[var(--nafa-orange)] text-[var(--nafa-orange)]" />
            <span className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>{product.rating.toFixed(1)}</span>
          </div>
        </div>
        <div className="space-y-3">
          {MOCK_REVIEWS.map((review) => (
            <div key={review.id} className="p-3 rounded-2xl" style={{ background: 'var(--nafa-gray-100)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>{review.name}</span>
                <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>{review.date}</span>
              </div>
              <RatingStars rating={review.rating} size={12} />
              <p className="text-sm mt-1.5" style={{ color: 'var(--nafa-gray-700)' }}>{review.comment}</p>
            </div>
          ))}
        </div>
      </div>

      </div>{/* end max-w-5xl */}

      {/* Sticky CTA — mobile only */}
      <div
        className="fixed bottom-20 left-0 right-0 px-4 pb-3 pt-4 max-w-2xl mx-auto lg:hidden"
        style={{ background: 'linear-gradient(to top, var(--nafa-white) 80%, transparent)' }}
      >
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ translateY: -1 }}
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addedToCart}
            className="flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border-2 transition-all"
            style={{
              borderColor: 'var(--nafa-orange)',
              color: addedToCart ? 'var(--nafa-white)' : 'var(--nafa-orange)',
              background: addedToCart ? 'var(--nafa-orange)' : 'transparent',
            }}
          >
            <ShoppingCart size={16} strokeWidth={1.75} />
            {addedToCart ? 'Ajouté !' : 'Panier'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ translateY: -1 }}
            onClick={handleBuyNow}
            disabled={product.stock === 0}
            className="flex-1 py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
            style={{ background: product.stock > 0 ? 'var(--nafa-orange)' : 'var(--nafa-gray-400)' }}
          >
            <Zap size={16} strokeWidth={1.75} />
            Acheter
          </motion.button>
        </div>
      </div>
    </div>
  );
}
