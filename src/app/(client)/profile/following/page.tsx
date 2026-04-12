'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Heart } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/EmptyState';

interface MockVendor {
  id: string;
  name: string;
  category: string;
  followerCount: number;
  initials: string;
  avatarColor: string;
}

const INITIAL_VENDORS: MockVendor[] = [
  {
    id: 'v1',
    name: 'Boutique Aminata',
    category: 'Mode & Vêtements',
    followerCount: 1240,
    initials: 'BA',
    avatarColor: 'linear-gradient(135deg, #f97316, #ea580c)',
  },
  {
    id: 'v2',
    name: 'Mode Dakar',
    category: 'Accessoires',
    followerCount: 876,
    initials: 'MD',
    avatarColor: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  },
  {
    id: 'v3',
    name: 'Tissus Kodjo',
    category: 'Tissus & Artisanat',
    followerCount: 2105,
    initials: 'TK',
    avatarColor: 'linear-gradient(135deg, #10b981, #059669)',
  },
  {
    id: 'v4',
    name: 'Artisan Chaussures',
    category: 'Chaussures',
    followerCount: 543,
    initials: 'AC',
    avatarColor: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  },
  {
    id: 'v5',
    name: 'Bijoux Fatou',
    category: 'Bijoux & Bijouterie',
    followerCount: 1892,
    initials: 'BF',
    avatarColor: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  exit: { opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export default function FollowingPage() {
  const [followed, setFollowed] = useState<Set<string>>(
    () => new Set(INITIAL_VENDORS.map((v) => v.id))
  );

  const visibleVendors = INITIAL_VENDORS.filter((v) => followed.has(v.id));

  const toggleFollow = (id: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
      <div className="max-w-2xl mx-auto px-4 md:px-6">
      {/* Sticky header */}
      <header
        className="sticky top-0 md:top-16 z-10 flex items-center gap-3 py-4"
        style={{ background: 'var(--nafa-white)', borderBottom: '1px solid var(--nafa-gray-200)' }}
      >
        <Link
          href="/profile"
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'var(--nafa-gray-100)' }}
          aria-label="Retour"
        >
          <ChevronLeft size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-black)' }} />
        </Link>
        <h1 className="text-lg font-bold" style={{ color: 'var(--nafa-black)' }}>
          Boutiques suivies
        </h1>
        <span
          className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}
        >
          {visibleVendors.length}
        </span>
      </header>

      <div className="py-4">
        <AnimatePresence mode="wait">
          {visibleVendors.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <EmptyState
                icon={Heart}
                title="Aucune boutique suivie"
                description="Vous ne suivez aucune boutique"
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <AnimatePresence>
                {visibleVendors.map((vendor) => (
                  <motion.div
                    key={vendor.id}
                    variants={cardVariants}
                    layout
                    exit="exit"
                    className="rounded-2xl p-4"
                    style={{ background: 'var(--nafa-white)' }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: vendor.avatarColor }}
                      >
                        {vendor.initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--nafa-gray-900)' }}>
                          {vendor.name}
                        </p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--nafa-gray-400)' }}>
                          {vendor.category}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }}>
                          {vendor.followerCount.toLocaleString('fr-FR')} abonnés
                        </p>
                      </div>

                      {/* Follow toggle */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleFollow(vendor.id)}
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: followed.has(vendor.id) ? 'var(--nafa-orange)' : 'var(--nafa-gray-100)',
                        }}
                        aria-label={followed.has(vendor.id) ? 'Ne plus suivre' : 'Suivre'}
                      >
                        <Heart
                          size={16}
                          strokeWidth={1.75}
                          style={{
                            color: followed.has(vendor.id) ? 'white' : 'var(--nafa-gray-400)',
                            fill: followed.has(vendor.id) ? 'white' : 'transparent',
                          }}
                        />
                      </motion.button>
                    </div>

                    {/* View shop button */}
                    <Link
                      href={`/vendor/${vendor.id}`}
                      className="mt-3 block text-center text-sm font-semibold py-2 rounded-xl border transition-colors"
                      style={{
                        borderColor: 'var(--nafa-orange)',
                        color: 'var(--nafa-orange)',
                      }}
                    >
                      Voir la boutique
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
