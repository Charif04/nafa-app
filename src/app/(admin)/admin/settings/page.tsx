'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Bell, Shield, Save, Lock, Percent,
  Globe, CheckCircle, Mail, Phone,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

const NOTIFICATION_ITEMS = [
  { id: 'new_order', label: 'Nouvelle commande', description: "Alerter à chaque commande reçue sur la plateforme" },
  { id: 'vendor_ship', label: 'Colis expédié par vendeur', description: "Quand un vendeur envoie un colis vers l'entrepôt" },
  { id: 'payment', label: 'Paiement confirmé', description: 'Notification lors de chaque transaction réussie' },
  { id: 'dispute', label: 'Litige client', description: 'Quand un client ouvre un litige sur une commande' },
];

const CURRENCIES = ['FCFA', 'EUR', 'USD', 'GHS', 'NGN'];

const sectionVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.32 } } };

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }}>
        <Icon size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
      </div>
      <h2 className="text-base font-semibold" style={{ color: 'var(--nafa-black)' }}>{title}</h2>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={onChange}
      className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200"
      style={{ background: checked ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)' }}>
      <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
        style={{ left: checked ? '22px' : '2px' }} />
    </button>
  );
}

export default function AdminSettingsPage() {
  const user = useAuthStore((s) => s.user);

  // Profil — seeded from store, editable
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  // Platform config (local — no backend table)
  const [commission, setCommission] = useState('10');
  const [currency, setCurrency] = useState('FCFA');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Notifications (local preference — no backend table)
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    new_order: true,
    vendor_ship: true,
    payment: false,
    dispute: true,
  });

  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Populate fields when auth store loads
  useEffect(() => {
    if (user) {
      setAdminName(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim());
      setAdminEmail(user.email ?? '');
      setAdminPhone(user.phone ?? '');
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      if (user) {
        const parts = adminName.trim().split(/\s+/);
        const firstName = parts[0] ?? '';
        const lastName = parts.slice(1).join(' ');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('profiles')
          .update({ first_name: firstName, last_name: lastName, phone: adminPhone || null })
          .eq('id', user.uid);
        if (error) throw error;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaveError('Erreur lors de la sauvegarde. Réessayez.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleNotif = (id: string) => setNotifications((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Toast */}
      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: -16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }} transition={{ duration: 0.25 }}
            className="fixed top-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-semibold"
            style={{ left: '50%', transform: 'translateX(-50%)', background: '#22c55e', whiteSpace: 'nowrap' }}>
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

        {/* Profil administrateur */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--nafa-gray-200)' }}>
          <SectionHeader icon={User} title="Profil administrateur" />
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>
                Nom complet
              </label>
              <div className="relative">
                <User size={15} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--nafa-gray-400)' }} />
                <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)', color: 'var(--nafa-black)' }} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>
                Email
              </label>
              <div className="relative">
                <Mail size={15} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--nafa-gray-400)' }} />
                <input type="email" value={adminEmail} readOnly
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none opacity-60 cursor-not-allowed"
                  style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)', color: 'var(--nafa-black)' }} />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--nafa-gray-400)' }}>
                L&apos;email est lié au compte Supabase et ne peut pas être modifié ici.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>
                Téléphone
              </label>
              <div className="relative">
                <Phone size={15} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--nafa-gray-400)' }} />
                <input type="tel" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none nafa-mono"
                  style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)', color: 'var(--nafa-black)' }} />
              </div>
            </div>
            {saveError && (
              <p className="text-xs text-red-500">{saveError}</p>
            )}
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: saved ? '#22c55e' : 'var(--nafa-orange)' }}>
              {isSaving
                ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <Save size={15} strokeWidth={1.75} />}
              {saved ? 'Enregistré !' : 'Enregistrer'}
            </motion.button>
          </div>
        </motion.div>

        {/* Configuration plateforme */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--nafa-gray-200)' }}>
          <SectionHeader icon={Globe} title="Configuration plateforme" />
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>
                Commission NAFA (%)
              </label>
              <div className="relative max-w-xs">
                <Percent size={15} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--nafa-gray-400)' }} />
                <input type="number" min="0" max="100" value={commission} onChange={(e) => setCommission(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none nafa-mono"
                  style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)', color: 'var(--nafa-black)' }} />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--nafa-gray-400)' }}>
                Prélevée sur le sous-total de chaque commande
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>
                Devise par défaut
              </label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                className="px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)', color: 'var(--nafa-black)' }}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid var(--nafa-gray-100)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>Mode maintenance</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }}>
                  Rend l&apos;app inaccessible aux clients et vendeurs
                </p>
              </div>
              <Toggle checked={maintenanceMode} onChange={() => setMaintenanceMode((p) => !p)} label="Mode maintenance" />
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--nafa-gray-200)' }}>
          <SectionHeader icon={Bell} title="Notifications" />
          <div className="space-y-1">
            {NOTIFICATION_ITEMS.map((item, i) => (
              <div key={item.id} className="flex items-center justify-between py-3.5"
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--nafa-gray-100)' }}>
                <div className="flex-1 pr-4">
                  <p className="text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>{item.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }}>{item.description}</p>
                </div>
                <Toggle checked={notifications[item.id]} onChange={() => toggleNotif(item.id)} label={item.label} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sécurité */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--nafa-gray-200)' }}>
          <SectionHeader icon={Shield} title="Sécurité" />
          <div className="flex items-center gap-3">
            <button disabled
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium opacity-60 cursor-not-allowed"
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
