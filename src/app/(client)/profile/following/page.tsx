'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Heart } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { EmptyState } from '@/components/shared/EmptyState';

interface FollowedVendor {
  id: string;
  shopName: string;
  followerCount: number;
  initials: string;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  exit: { opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function FollowingPage() {
  const [vendors, setVendors] = useState<FollowedVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unfollowing, setUnfollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch follows with vendor_profiles data via profiles join
      const { data } = await supabase
        .from('follows')
        .select(`
          vendor_id,
          vendor:profiles!follows_vendor_id_fkey(
            vendor_profiles(shop_name, follower_count)
          )
        `)
        .eq('follower_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: FollowedVendor[] = (data as any[])
          .map((row) => {
            const vp = Array.isArray(row.vendor?.vendor_profiles)
              ? row.vendor.vendor_profiles[0]
              : row.vendor?.vendor_profiles;
            if (!vp) return null;
            return {
              id: row.vendor_id,
              shopName: vp.shop_name ?? '',
              followerCount: vp.follower_count ?? 0,
              initials: getInitials(vp.shop_name ?? ''),
            };
          })
          .filter(Boolean) as FollowedVendor[];
        setVendors(mapped);
      }

      setIsLoading(false);
    }
    load();
  }, []);

  const handleUnfollow = async (vendorId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUnfollowing((prev) => new Set(prev).add(vendorId));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('vendor_id', vendorId);

    setVendors((prev) => prev.filter((v) => v.id !== vendorId));
    setUnfollowing((prev) => {
      const next = new Set(prev);
      next.delete(vendorId);
      return next;
    });
  };

  const AVATAR_COLORS = [
    'linear-gradient(135deg, #f97316, #ea580c)',
    'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
  ];
  const getColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
  };

  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
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
            {vendors.length}
          </span>
        </header>

        <div className="py-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {vendors.length === 0 ? (
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
                    {vendors.map((vendor) => (
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
                            style={{ background: getColor(vendor.id) }}
                          >
                            {vendor.initials}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--nafa-gray-900)' }}>
                              {vendor.shopName}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }}>
                              {vendor.followerCount.toLocaleString('fr-FR')} abonnés
                            </p>
                          </div>

                          {/* Unfollow button */}
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleUnfollow(vendor.id)}
                            disabled={unfollowing.has(vendor.id)}
                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: 'var(--nafa-orange)' }}
                            aria-label="Ne plus suivre"
                          >
                            <Heart
                              size={16}
                              strokeWidth={1.75}
                              style={{ color: 'white', fill: 'white' }}
                            />
                          </motion.button>
                        </div>

                        {/* View shop button */}
                        <Link
                          href={`/vendor/${vendor.id}`}
                          className="mt-3 block text-center text-sm font-semibold py-2 rounded-xl border transition-colors"
                          style={{ borderColor: 'var(--nafa-orange)', color: 'var(--nafa-orange)' }}
                        >
                          Voir la boutique
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
