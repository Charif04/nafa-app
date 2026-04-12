'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Heart, Package, ShoppingBag, Calendar, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { RatingStars } from '@/components/shared/RatingStars';
import { ProductCard } from '@/components/shared/ProductCard';
import type { Product } from '@/types';

interface VendorReview {
  id: string;
  clientName: string;
  initials: string;
  rating: number;
  comment: string;
  date: string;
  productTitle: string;
}

const MOCK_REVIEWS: VendorReview[] = [
  { id: 'r1', clientName: 'Fatou N.', initials: 'FN', rating: 5, comment: 'Qualité exceptionnelle ! Le tissu est magnifique et la livraison a été rapide. Je recommande vivement cette boutique.', date: 'Il y a 3 jours', productTitle: 'Boubou brodé traditionnel' },
  { id: 'r2', clientName: 'Ibrahim K.', initials: 'IK', rating: 4, comment: 'Très beau produit, conforme à la description. Juste un petit retard dans l\'expédition mais vendeur très réactif.', date: 'Il y a 1 semaine', productTitle: 'Sac en cuir artisanal' },
  { id: 'r3', clientName: 'Aminata B.', initials: 'AB', rating: 5, comment: 'Parfait pour la cérémonie de mariage ! Tout le monde a adoré. Je reviendrai commander.', date: 'Il y a 2 semaines', productTitle: 'Tissu wax imprimé' },
  { id: 'r4', clientName: 'Moussa D.', initials: 'MD', rating: 5, comment: 'Artisan très professionnel. Les sandales sont solides et bien finies. Merci !', date: 'Il y a 1 mois', productTitle: 'Sandales tressées' },
];

interface VendorData {
  id: string;
  name: string;
  shopName: string;
  initials: string;
  avatarColor: string;
  category: string;
  rating: number;
  reviewCount: number;
  followerCount: number;
  productCount: number;
  totalSales: number;
  memberSince: string;
  description: string;
}

const MOCK_VENDORS: Record<string, VendorData> = {
  v1: {
    id: 'v1',
    name: 'Aminata Diallo',
    shopName: 'Boutique Aminata',
    initials: 'BA',
    avatarColor: 'linear-gradient(135deg, #f97316, #ea580c)',
    category: 'Mode & Vêtements',
    rating: 4.8,
    reviewCount: 312,
    followerCount: 1240,
    productCount: 48,
    totalSales: 2134,
    memberSince: '2023-02-15',
    description: 'Spécialiste en mode africaine authentique. Boubous brodés, bazin et tissus wax.',
  },
  v2: {
    id: 'v2',
    name: 'Kofi Mensah',
    shopName: 'Mode Dakar',
    initials: 'MD',
    avatarColor: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    category: 'Accessoires',
    rating: 4.5,
    reviewCount: 187,
    followerCount: 876,
    productCount: 32,
    totalSales: 965,
    memberSince: '2023-07-10',
    description: 'Accessoires tendance et sacs en cuir fabriqués artisanalement à Dakar.',
  },
  v3: {
    id: 'v3',
    name: 'Kodjo Amoah',
    shopName: 'Tissus Kodjo',
    initials: 'TK',
    avatarColor: 'linear-gradient(135deg, #10b981, #059669)',
    category: 'Tissus & Artisanat',
    rating: 4.9,
    reviewCount: 524,
    followerCount: 2105,
    productCount: 76,
    totalSales: 4210,
    memberSince: '2022-11-01',
    description: 'Les plus beaux tissus wax et kente directement importés du Ghana et du Bénin.',
  },
  v4: {
    id: 'v4',
    name: 'Oumar Sow',
    shopName: 'Artisan Chaussures',
    initials: 'AC',
    avatarColor: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    category: 'Chaussures',
    rating: 4.3,
    reviewCount: 98,
    followerCount: 543,
    productCount: 24,
    totalSales: 411,
    memberSince: '2024-01-20',
    description: 'Sandales et chaussures artisanales en cuir véritable, faites à la main.',
  },
  v5: {
    id: 'v5',
    name: 'Fatou Ndiaye',
    shopName: 'Bijoux Fatou',
    initials: 'BF',
    avatarColor: 'linear-gradient(135deg, #f59e0b, #d97706)',
    category: 'Bijoux & Bijouterie',
    rating: 4.7,
    reviewCount: 276,
    followerCount: 1892,
    productCount: 61,
    totalSales: 1780,
    memberSince: '2023-04-05',
    description: 'Bijoux traditionnels en or, argent et bronze. Créations uniques inspirées du Sahel.',
  },
};

const DEFAULT_VENDOR: VendorData = {
  id: 'default',
  name: 'Vendeur NAFA',
  shopName: 'Boutique NAFA',
  initials: 'BN',
  avatarColor: 'linear-gradient(135deg, var(--nafa-orange), #ea580c)',
  category: 'Divers',
  rating: 4.0,
  reviewCount: 12,
  followerCount: 120,
  productCount: 15,
  totalSales: 88,
  memberSince: '2024-06-01',
  description: 'Bienvenue dans notre boutique. Découvrez notre sélection de produits.',
};

function makeMockProducts(vendorId: string, shopName: string): Product[] {
  const images = [
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&h=400&fit=crop',
  ];

  const titles = [
    'Boubou brodé traditionnel',
    'Sac en cuir artisanal',
    'Tissu wax imprimé',
    'Sandales tressées',
    'Collier en bronze',
    'Chapeau de paille',
  ];

  return titles.map((title, i) => ({
    id: `${vendorId}-p${i + 1}`,
    vendorId,
    vendorName: shopName,
    title,
    description: 'Produit artisanal de qualité supérieure.',
    price: 5000 + i * 3500,
    currency: 'FCFA' as const,
    images: [images[i] ?? images[0]!],
    category: 'Mode',
    stock: i === 2 ? 0 : 5 + i,
    rating: 4.0 + (i % 3) * 0.3,
    reviewCount: 12 + i * 8,
    createdAt: new Date(Date.now() - 86400000 * (10 + i)).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * i).toISOString(),
  }));
}

function formatMemberSince(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export default function VendorStorefrontPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const vendorId = params.id;

  const vendor = MOCK_VENDORS[vendorId] ?? DEFAULT_VENDOR;
  const products = makeMockProducts(vendor.id, vendor.shopName);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(vendor.followerCount);

  const handleFollowToggle = () => {
    setIsFollowing((prev) => {
      const next = !prev;
      setFollowerCount((c) => (next ? c + 1 : c - 1));
      return next;
    });
  };

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
        <h1
          className="text-base font-bold truncate flex-1"
          style={{ color: 'var(--nafa-black)' }}
        >
          {vendor.shopName}
        </h1>
      </header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero section */}
        <motion.section
          variants={itemVariants}
          className="py-6"
          style={{ background: 'var(--nafa-white)' }}
        >
          <div className="lg:flex lg:items-start lg:gap-6">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
              style={{ background: vendor.avatarColor }}
            >
              {vendor.initials}
            </div>

            {/* Info + follow */}
            <div className="flex-1 mt-4 lg:mt-0">
              <div className="flex items-start justify-between mb-1">
                {/* Shop name & category */}
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--nafa-black)' }}>
                    {vendor.shopName}
                  </h2>
                  <span
                    className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mt-1 mb-2"
                    style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-orange)' }}
                  >
                    {vendor.category}
                  </span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={handleFollowToggle}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors flex-shrink-0"
                  style={
                    isFollowing
                      ? {
                          background: 'var(--nafa-orange)',
                          borderColor: 'var(--nafa-orange)',
                          color: 'white',
                        }
                      : {
                          background: 'transparent',
                          borderColor: 'var(--nafa-orange)',
                          color: 'var(--nafa-orange)',
                        }
                  }
                  aria-label={isFollowing ? 'Ne plus suivre' : 'Suivre'}
                >
                  <Heart
                    size={14}
                    strokeWidth={1.75}
                    style={{ fill: isFollowing ? 'white' : 'transparent' }}
                  />
                  {isFollowing ? 'Suivi' : 'Suivre'}
                </motion.button>
              </div>

              {/* Description */}
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--nafa-gray-700)' }}>
                {vendor.description}
              </p>

              {/* Rating */}
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
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center mb-1"
                style={{ background: 'var(--nafa-gray-100)' }}
              >
                <Package size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
              </div>
              <span className="text-base font-bold" style={{ color: 'var(--nafa-black)' }}>
                {vendor.productCount}
              </span>
              <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>
                Produits
              </span>
            </div>

            <div className="flex flex-col items-center py-4 gap-1">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center mb-1"
                style={{ background: 'var(--nafa-gray-100)' }}
              >
                <ShoppingBag size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
              </div>
              <span className="text-base font-bold" style={{ color: 'var(--nafa-black)' }}>
                {vendor.totalSales.toLocaleString('fr-FR')}
              </span>
              <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>
                Ventes
              </span>
            </div>

            <div className="flex flex-col items-center py-4 gap-1">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center mb-1"
                style={{ background: 'var(--nafa-gray-100)' }}
              >
                <Calendar size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
              </div>
              <span className="text-base font-bold" style={{ color: 'var(--nafa-black)' }}>
                {new Date(vendor.memberSince).getFullYear()}
              </span>
              <span className="text-xs text-center leading-tight" style={{ color: 'var(--nafa-gray-400)' }}>
                Depuis {formatMemberSince(vendor.memberSince)}
              </span>
            </div>
          </div>
        </motion.section>

        {/* Products grid */}
        <motion.section variants={itemVariants} className="pb-4">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--nafa-gray-900)' }}>
            Produits de la boutique
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
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
          <div className="space-y-3">
            {MOCK_REVIEWS.map((review) => (
              <div key={review.id} className="p-4 rounded-2xl" style={{ background: 'var(--nafa-white)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--nafa-orange), #e55a00)' }}>
                    {review.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--nafa-black)' }}>{review.clientName}</p>
                      <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>{review.date}</span>
                    </div>
                    <RatingStars rating={review.rating} size={12} />
                    <p className="text-xs mt-1 mb-1.5" style={{ color: 'var(--nafa-gray-400)' }}>
                      Acheté : {review.productTitle}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--nafa-gray-700)' }}>{review.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </motion.div>
      </div>
    </div>
  );
}
