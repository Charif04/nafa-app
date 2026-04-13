'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Phone,
  Globe,
  DollarSign,
  LogOut,
  Store,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { BecomeVendorModal } from '@/components/shared/BecomeVendorModal';

const ALL_LANGUAGES = [
  { label: 'Français', available: true },
  { label: 'English', available: false },
] as const;
const CURRENCIES = ['FCFA', 'EUR', 'USD'];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Français');
  const [selectedCurrency, setSelectedCurrency] = useState('FCFA');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);

  useEffect(() => {
    const storedLanguage = localStorage.getItem('nafa_language');
    const storedCurrency = localStorage.getItem('nafa_currency');
    if (storedLanguage && ALL_LANGUAGES.some((l) => l.label === storedLanguage && l.available)) setSelectedLanguage(storedLanguage);
    if (storedCurrency && CURRENCIES.includes(storedCurrency)) setSelectedCurrency(storedCurrency);
  }, []);

  useEffect(() => { localStorage.setItem('nafa_language', selectedLanguage as string); }, [selectedLanguage]);
  useEffect(() => { localStorage.setItem('nafa_currency', selectedCurrency); }, [selectedCurrency]);

  const handleLogout = async () => {
    const confirmed = window.confirm('Voulez-vous vraiment vous déconnecter ?');
    if (!confirmed) return;
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <>
      <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
        <div className="max-w-4xl mx-auto">
          <header
            className="sticky top-0 md:top-16 z-10 flex items-center gap-3 px-4 py-4"
            style={{ background: 'var(--nafa-white)', borderBottom: '1px solid var(--nafa-gray-200)' }}
          >
            <Link href="/profile" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }} aria-label="Retour">
              <ChevronLeft size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-black)' }} />
            </Link>
            <h1 className="text-lg font-bold" style={{ color: 'var(--nafa-black)' }}>Paramètres</h1>
          </header>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="px-4 py-4 space-y-4">

            {/* Mon compte */}
            <motion.section variants={sectionVariants}>
              <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>
                Mon compte
              </p>
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--nafa-white)' }}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--nafa-gray-100)' }}>
                    <Lock size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>Email</p>
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--nafa-gray-900)' }}>{user?.email ?? '—'}</p>
                  </div>
                </div>
                <div style={{ height: '1px', background: 'var(--nafa-gray-100)', margin: '0 16px' }} />
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--nafa-gray-100)' }}>
                    <Phone size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>Téléphone</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--nafa-gray-900)' }}>{user?.phone ?? '—'}</p>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Devenir vendeur */}
            <motion.section variants={sectionVariants}>
              <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>
                Ma boutique
              </p>
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--nafa-white)' }}>
                <button
                  onClick={() => setShowVendorModal(true)}
                  className="flex items-center gap-3 px-4 py-4 w-full text-left"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,107,44,0.08)' }}>
                    <Store size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--nafa-black)' }}>Devenir vendeur</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-700)' }}>Vendez vos produits sur NAFA</p>
                  </div>
                  <ChevronRight size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                </button>
              </div>
            </motion.section>

            {/* Préférences */}
            <motion.section variants={sectionVariants}>
              <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>
                Préférences
              </p>
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--nafa-white)' }}>
                {/* Language */}
                <button
                  onClick={() => { setShowLanguagePicker((v) => !v); setShowCurrencyPicker(false); }}
                  className="flex items-center gap-3 px-4 py-3.5 w-full text-left"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--nafa-gray-100)' }}>
                    <Globe size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>Langue</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--nafa-gray-900)' }}>{selectedLanguage}</p>
                  </div>
                  <motion.div animate={{ rotate: showLanguagePicker ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {showLanguagePicker && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      style={{ overflow: 'hidden', borderTop: '1px solid var(--nafa-gray-100)' }}
                    >
                      {ALL_LANGUAGES.map(({ label, available }) => (
                        <button key={label}
                          onClick={() => { if (available) { setSelectedLanguage(label as string); setShowLanguagePicker(false); } }}
                          disabled={!available}
                          className="flex items-center justify-between px-4 py-3 w-full text-left"
                          style={{ borderTop: '1px solid var(--nafa-gray-100)', opacity: available ? 1 : 0.5 }}>
                          <span className="text-sm" style={{ color: 'var(--nafa-gray-900)' }}>{label}</span>
                          <div className="flex items-center gap-2">
                            {!available && (
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-400)' }}>
                                Bientôt
                              </span>
                            )}
                            {available && selectedLanguage === label && <div className="w-4 h-4 rounded-full" style={{ background: 'var(--nafa-orange)' }} />}
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ height: '1px', background: 'var(--nafa-gray-100)', margin: '0 16px' }} />

                {/* Currency */}
                <button
                  onClick={() => { setShowCurrencyPicker((v) => !v); setShowLanguagePicker(false); }}
                  className="flex items-center gap-3 px-4 py-3.5 w-full text-left"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--nafa-gray-100)' }}>
                    <DollarSign size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>Devise</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--nafa-gray-900)' }}>{selectedCurrency}</p>
                  </div>
                  <motion.div animate={{ rotate: showCurrencyPicker ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {showCurrencyPicker && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      style={{ overflow: 'hidden', borderTop: '1px solid var(--nafa-gray-100)' }}
                    >
                      {CURRENCIES.map((cur) => (
                        <button key={cur} onClick={() => { setSelectedCurrency(cur); setShowCurrencyPicker(false); }}
                          className="flex items-center justify-between px-4 py-3 w-full text-left"
                          style={{ borderTop: '1px solid var(--nafa-gray-100)' }}>
                          <span className="text-sm" style={{ color: 'var(--nafa-gray-900)' }}>{cur}</span>
                          {selectedCurrency === cur && <div className="w-4 h-4 rounded-full" style={{ background: 'var(--nafa-orange)' }} />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>

            {/* Sécurité */}
            <motion.section variants={sectionVariants}>
              <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>
                Sécurité
              </p>
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--nafa-white)' }}>
                <div className="flex items-center gap-3 px-4 py-3.5 opacity-60">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--nafa-gray-100)' }}>
                    <Lock size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                  </div>
                  <span className="flex-1 text-sm font-medium" style={{ color: 'var(--nafa-gray-900)' }}>Modifier le mot de passe</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-400)' }}>
                    Bientôt disponible
                  </span>
                  <ChevronRight size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                </div>
                <div style={{ height: '1px', background: 'var(--nafa-gray-100)', margin: '0 16px' }} />
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3.5 w-full text-left">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50">
                    <LogOut size={16} strokeWidth={1.75} className="text-red-500" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-red-500">Se déconnecter</span>
                </button>
              </div>
            </motion.section>

          </motion.div>
        </div>
      </div>

      {/* Vendor upgrade modal */}
      <AnimatePresence>
        {showVendorModal && <BecomeVendorModal onClose={() => setShowVendorModal(false)} />}
      </AnimatePresence>
    </>
  );
}
