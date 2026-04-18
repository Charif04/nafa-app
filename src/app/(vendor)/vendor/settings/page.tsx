'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Bell, BellOff, Shield, Save, Lock, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Skeleton } from '@/components/shared/SkeletonShimmer';
import { subscribeToPush, unsubscribeFromPush } from '@/lib/pushNotifications';

const NOTIFICATION_ITEMS = [
  { id: 'new_order', label: 'Nouvelle commande', description: 'Recevoir une alerte à chaque nouvelle commande' },
  { id: 'payment', label: 'Paiement reçu', description: 'Être notifié lors de chaque paiement confirmé' },
  { id: 'review', label: 'Avis client', description: 'Être informé quand un client laisse un avis' },
];

const sectionVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function VendorSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setShopName = useAuthStore((s) => s.setShopName);

  const [shopName, setShopNameLocal] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    new_order: true, payment: true, review: false,
  });
  const [pushEnabled, setPushEnabled] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });
  const [pushLoading, setPushLoading] = useState(false);

  const handleTogglePush = async () => {
    if (!user?.uid || pushLoading) return;
    setPushLoading(true);
    if (pushEnabled) {
      await unsubscribeFromPush(user.uid);
      setPushEnabled(false);
    } else {
      const ok = await subscribeToPush(user.uid);
      setPushEnabled(ok);
    }
    setPushLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadProfile() {
    setIsLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('vendor_profiles')
      .select('shop_name, shop_description')
      .eq('id', user!.uid)
      .single();

    if (data) {
      setShopNameLocal(data.shop_name ?? '');
      setDescription(data.shop_description ?? '');
    }
    setIsLoading(false);
  }

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('vendor_profiles')
      .update({ shop_name: shopName.trim(), shop_description: description.trim() })
      .eq('id', user.uid);

    // Update sidebar immediately
    setShopName(shopName.trim());

    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleNotification = (id: string) => {
    setNotifications((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed top-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-semibold"
            style={{ left: '50%', transform: 'translateX(-50%)', background: '#22c55e', whiteSpace: 'nowrap' }}
          >
            <CheckCircle size={16} strokeWidth={1.75} />
            Paramètres sauvegardés
          </motion.div>
        )}
      </AnimatePresence>

      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold mb-8" style={{ color: 'var(--nafa-black)' }}>
        Paramètres
      </motion.h1>

      <motion.div variants={sectionVariants} initial="hidden" animate="visible" className="space-y-6">

        {/* Informations boutique */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--nafa-gray-200)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }}>
              <Store size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
            </div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--nafa-black)' }}>Informations boutique</h2>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>
                  Nom de la boutique
                </label>
                <input type="text" value={shopName} onChange={(e) => setShopNameLocal(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)', color: 'var(--nafa-black)' }} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                  placeholder="Décrivez votre boutique..."
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
                  style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)', color: 'var(--nafa-black)' }} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>Email du compte</label>
                <input type="text" value={user?.email ?? ''} disabled
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none opacity-60 cursor-not-allowed"
                  style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }} />
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: saved ? '#22c55e' : 'var(--nafa-orange)', opacity: isSaving ? 0.7 : 1 }}>
                {isSaving
                  ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  : <Save size={16} strokeWidth={1.75} />
                }
                {saved ? 'Enregistré !' : 'Enregistrer'}
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Notifications */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--nafa-gray-200)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }}>
              <Bell size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
            </div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--nafa-black)' }}>Notifications</h2>
          </div>
          <div className="space-y-1">
            {/* Push toggle — must be user-gesture triggered (required on iOS) */}
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-3 flex-1 pr-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: pushEnabled ? 'rgba(255,107,44,0.08)' : 'var(--nafa-gray-100)' }}>
                  {pushEnabled
                    ? <Bell size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                    : <BellOff size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                  }
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>Notifications push</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }}>
                    {pushEnabled ? 'Alertes en temps réel activées' : 'Appuyez pour activer sur cet appareil'}
                  </p>
                </div>
              </div>
              <button
                role="switch"
                aria-checked={pushEnabled}
                aria-label="Notifications push"
                onClick={() => void handleTogglePush()}
                disabled={pushLoading}
                className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200"
                style={{ background: pushEnabled ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)' }}
              >
                <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
                  style={{ left: pushEnabled ? '22px' : '2px' }} />
              </button>
            </div>
            {NOTIFICATION_ITEMS.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3.5"
                style={{ borderTop: '1px solid var(--nafa-gray-100)' }}>
                <div className="flex-1 pr-4">
                  <p className="text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>{item.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }}>{item.description}</p>
                </div>
                <button role="switch" aria-checked={notifications[item.id]} aria-label={item.label}
                  onClick={() => toggleNotification(item.id)}
                  className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200"
                  style={{ background: notifications[item.id] ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)' }}>
                  <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
                    style={{ left: notifications[item.id] ? '22px' : '2px' }} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Compte */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--nafa-gray-200)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }}>
              <Shield size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
            </div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--nafa-black)' }}>Compte</h2>
          </div>
          <div className="flex items-center gap-3">
            <button disabled className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium cursor-not-allowed opacity-60"
              style={{ borderColor: 'var(--nafa-gray-200)', color: 'var(--nafa-gray-700)' }}>
              <Lock size={15} strokeWidth={1.75} />
              Changer le mot de passe
            </button>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-400)' }}>
              Bientôt disponible
            </span>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
