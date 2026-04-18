'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, ChevronRight, Package, Star, Users,
  Store, ArrowRight, Settings, MapPin, Heart,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { BecomeVendorModal } from '@/components/shared/BecomeVendorModal';
import { AvatarUpload } from '@/components/shared/AvatarUpload';

// ─── Profile page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const [showVendorModal, setShowVendorModal] = useState(false);
  const user = useAuthStore((s) => s.user);
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const handleLogout = async () => {
    const confirmed = window.confirm('Voulez-vous vraiment vous déconnecter ?');
    if (!confirmed) return;
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
  const itemVariants = { hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3 } } };

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : '—';
  const initial = user?.firstName?.[0]?.toUpperCase() ?? '?';
  const location = [user?.region, user?.country].filter(Boolean).join(', ') || 'Burkina Faso';

  return (
    <>
      <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
      <div className="max-w-2xl mx-auto">
          {/* Profile header */}
          <div className="px-4 pt-8 pb-6" style={{ background: 'var(--nafa-white)' }}>
            <div className="flex items-center gap-4">
              <AvatarUpload size="lg" />
              <div>
                <h1 className="text-lg font-bold" style={{ color: 'var(--nafa-black)' }}>{displayName}</h1>
                <p className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>{user?.email ?? '—'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={11} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                  <p className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>{location}</p>
                </div>
              </div>
            </div>
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="px-4 py-4 space-y-4">

            {/* Devenir vendeur — only for clients */}
            {user?.role === 'client' && (
            <motion.div variants={itemVariants}>
              <button onClick={() => setShowVendorModal(true)} className="w-full text-left">
                <motion.div whileTap={{ scale: 0.98 }}
                  className="rounded-2xl p-4 flex items-center gap-4"
                  style={{ background: 'linear-gradient(135deg, var(--nafa-orange), #e55a00)' }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <Store size={20} strokeWidth={1.75} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">Devenir vendeur</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>Vendez vos produits sur NAFA</p>
                  </div>
                  <ArrowRight size={18} strokeWidth={1.75} className="text-white flex-shrink-0" />
                </motion.div>
              </button>
            </motion.div>
            )}

            {/* Mon compte */}
            <motion.div variants={itemVariants} className="rounded-2xl overflow-hidden" style={{ background: 'var(--nafa-white)' }}>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>Mon compte</p>
              {[
                { icon: Package, label: 'Mes commandes', href: '/profile/orders', badge: null },
                { icon: Heart, label: 'Mes favoris', href: '/profile/favorites', badge: wishlistCount > 0 ? wishlistCount : null },
                { icon: Star, label: 'Mes avis', href: '/profile/reviews', badge: null },
                { icon: Users, label: 'Vendeurs suivis', href: '/profile/following', badge: null },
              ].map((item, i) => (
                <Link key={item.label} href={item.href}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--nafa-gray-100)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }}>
                    <item.icon size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                  </div>
                  <span className="flex-1 text-sm font-medium" style={{ color: 'var(--nafa-gray-900)' }}>{item.label}</span>
                  {item.badge !== null && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full mr-1"
                      style={{ background: 'rgba(255,107,44,0.1)', color: 'var(--nafa-orange)' }}>
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                </Link>
              ))}
            </motion.div>

            {/* Paramètres */}
            <motion.div variants={itemVariants} className="rounded-2xl overflow-hidden" style={{ background: 'var(--nafa-white)' }}>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>Paramètres</p>
              <Link href="/profile/settings"
                className="flex items-center gap-3 px-4 py-3.5 transition-colors">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }}>
                  <Settings size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium" style={{ color: 'var(--nafa-gray-900)' }}>Langue, devise & sécurité</span>
                </div>
                <ChevronRight size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
              </Link>
            </motion.div>

            {/* Déconnexion */}
            <motion.div variants={itemVariants} className="rounded-2xl overflow-hidden" style={{ background: 'var(--nafa-white)' }}>
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3.5 w-full text-left">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-50">
                  <LogOut size={16} strokeWidth={1.75} className="text-red-500" />
                </div>
                <span className="flex-1 text-sm font-medium text-red-500">Se déconnecter</span>
              </button>
            </motion.div>

            <p className="text-center text-xs py-2" style={{ color: 'var(--nafa-gray-400)' }}>NAFA Market v1.0.0</p>
          </motion.div>
      </div>
      </div>

      <AnimatePresence>
        {showVendorModal && <BecomeVendorModal onClose={() => setShowVendorModal(false)} />}
      </AnimatePresence>
    </>
  );
}
