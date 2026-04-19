'use client';

import { useState } from 'react';
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
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Save,
  Check,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { BecomeVendorModal } from '@/components/shared/BecomeVendorModal';
import { AvatarUpload } from '@/components/shared/AvatarUpload';
import { subscribeToPush, unsubscribeFromPush } from '@/lib/pushNotifications';

const ALL_LANGUAGES = [
  { label: 'Français', code: 'fr' as const, available: true },
  { label: 'English', code: 'en' as const, available: false },
] as const;
const CURRENCIES = [
  { code: 'FCFA', available: true },
  { code: 'EUR', available: false },
  { code: 'USD', available: false },
] as const;

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
  const selectedCurrency = useUiStore((s) => s.currency);
  const setCurrency = useUiStore((s) => s.setCurrency);
  const storedLang = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);
  const selectedLanguageLabel = ALL_LANGUAGES.find((l) => l.code === storedLang)?.label ?? 'Français';
  const setSelectedLanguage = (label: string) => {
    const found = ALL_LANGUAGES.find((l) => l.label === label);
    if (found) setLanguage(found.code);
  };
  const setSelectedCurrency = (cur: string) => setCurrency(cur as import('@/types').Currency);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });
  const [pushLoading, setPushLoading] = useState(false);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Logout modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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


  const handleChangePassword = async () => {
    setPasswordError('');
    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }
    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSaved(true);
      setTimeout(() => {
        setPasswordSaved(false);
        setShowPasswordForm(false);
        setNewPassword('');
        setConfirmPassword('');
      }, 1800);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
    <>
      <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
          <header
            className="nafa-client-header z-10 flex items-center gap-3 px-4 py-4"
            style={{ background: 'var(--nafa-white)', borderBottom: '1px solid var(--nafa-gray-200)' }}
          >
            <Link href="/profile" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }} aria-label="Retour">
              <ChevronLeft size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-black)' }} />
            </Link>
            <h1 className="text-lg font-bold" style={{ color: 'var(--nafa-black)' }}>Paramètres</h1>
          </header>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="px-4 py-4 space-y-4">

            {/* Photo de profil */}
            <motion.section variants={sectionVariants}>
              <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>
                Photo de profil
              </p>
              <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'var(--nafa-white)' }}>
                <AvatarUpload size="lg" />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--nafa-black)' }}>
                    {user ? `${user.firstName} ${user.lastName}`.trim() : '—'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }}>
                    Appuyez sur la photo pour la modifier
                  </p>
                </div>
              </div>
            </motion.section>

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
                    <p className="text-sm font-medium" style={{ color: 'var(--nafa-gray-900)' }}>{selectedLanguageLabel}</p>
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
                          onClick={() => { if (available) { setSelectedLanguage(label); setShowLanguagePicker(false); } }}
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
                            {available && selectedLanguageLabel === label && <div className="w-4 h-4 rounded-full" style={{ background: 'var(--nafa-orange)' }} />}
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
                      {CURRENCIES.map(({ code, available }) => (
                        <button
                          key={code}
                          onClick={() => { if (available) { setSelectedCurrency(code); setShowCurrencyPicker(false); } }}
                          disabled={!available}
                          className="flex items-center justify-between px-4 py-3 w-full text-left"
                          style={{ borderTop: '1px solid var(--nafa-gray-100)', opacity: available ? 1 : 0.5 }}
                        >
                          <span className="text-sm" style={{ color: 'var(--nafa-gray-900)' }}>{code}</span>
                          <div className="flex items-center gap-2">
                            {!available && (
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-400)' }}>
                                Bientôt
                              </span>
                            )}
                            {available && selectedCurrency === code && <div className="w-4 h-4 rounded-full" style={{ background: 'var(--nafa-orange)' }} />}
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>

            {/* Notifications */}
            <motion.section variants={sectionVariants}>
              <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>
                Notifications
              </p>
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--nafa-white)' }}>
                <button
                  onClick={() => void handleTogglePush()}
                  disabled={pushLoading}
                  className="flex items-center gap-3 px-4 py-3.5 w-full text-left"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: pushEnabled ? 'rgba(255,107,44,0.08)' : 'var(--nafa-gray-100)' }}>
                    {pushEnabled
                      ? <Bell size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                      : <BellOff size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--nafa-gray-900)' }}>Notifications push</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }}>
                      {pushEnabled ? 'Activées — vous recevrez des alertes en temps réel' : 'Désactivées — appuyez pour activer'}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div
                      className="w-11 h-6 rounded-full transition-colors relative"
                      style={{ background: pushEnabled ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)' }}
                    >
                      <div
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                        style={{ transform: pushEnabled ? 'translateX(20px)' : 'translateX(2px)' }}
                      />
                    </div>
                  </div>
                </button>
              </div>
            </motion.section>

            {/* Sécurité */}
            <motion.section variants={sectionVariants}>
              <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>
                Sécurité
              </p>
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--nafa-white)' }}>
                {!showPasswordForm ? (
                  <button onClick={() => setShowPasswordForm(true)} className="flex items-center gap-3 px-4 py-3.5 w-full text-left">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--nafa-gray-100)' }}>
                      <Shield size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                    </div>
                    <span className="flex-1 text-sm font-medium" style={{ color: 'var(--nafa-gray-900)' }}>Modifier le mot de passe</span>
                    <ChevronRight size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                  </button>
                ) : (
                  <div className="px-4 py-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--nafa-gray-400)' }}>Nouveau mot de passe</label>
                      <div className="relative">
                        <input
                          type={showNewPwd ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 8 caractères"
                          className="w-full pl-4 pr-11 py-3 rounded-xl border text-sm outline-none"
                          style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)', color: 'var(--nafa-black)' }}
                        />
                        <button type="button" onClick={() => setShowNewPwd((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }}>
                          {showNewPwd ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--nafa-gray-400)' }}>Confirmer le mot de passe</label>
                      <div className="relative">
                        <input
                          type={showConfirmPwd ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Répétez le mot de passe"
                          className="w-full pl-4 pr-11 py-3 rounded-xl border text-sm outline-none"
                          style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)', color: 'var(--nafa-black)' }}
                        />
                        <button type="button" onClick={() => setShowConfirmPwd((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }}>
                          {showConfirmPwd ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                        </button>
                      </div>
                    </div>
                    {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                        style={{ borderColor: 'var(--nafa-gray-200)', color: 'var(--nafa-gray-700)' }}>
                        Annuler
                      </button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={handleChangePassword} disabled={passwordSaving}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                        style={{ background: passwordSaved ? '#22c55e' : 'var(--nafa-orange)' }}>
                        {passwordSaving
                          ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          : passwordSaved
                          ? <><Check size={15} strokeWidth={2.5} /> Modifié !</>
                          : <><Save size={15} strokeWidth={1.75} /> Enregistrer</>}
                      </motion.button>
                    </div>
                  </div>
                )}
                <div style={{ height: '1px', background: 'var(--nafa-gray-100)', margin: '0 16px' }} />
                <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-3 px-4 py-3.5 w-full text-left">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50">
                    <LogOut size={16} strokeWidth={1.75} className="text-red-500" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-red-500">Se déconnecter</span>
                </button>
              </div>
            </motion.section>

            {/* À propos */}
            <motion.section variants={sectionVariants}>
              <div className="flex flex-col items-center gap-2 py-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--nafa-orange) 0%, var(--nafa-orange-dark, #e55a1c) 100%)' }}>
                  <span className="text-white font-black text-xl">N</span>
                </div>
                <p className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>NAFA</p>
                <p className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>Version 1.0.0</p>
                <p className="text-xs text-center" style={{ color: 'var(--nafa-gray-400)' }}>
                  Conçu &amp; développé par{' '}
                  <span className="font-nitro" style={{ color: 'var(--nafa-orange)', fontSize: '1.05em', letterSpacing: '0.02em' }}>Kim_San</span>
                </p>
                <p className="text-xs" style={{ color: 'var(--nafa-gray-300)' }}>© 2025 NAFA · Tous droits réservés</p>
              </div>
            </motion.section>

          </motion.div>
      </div>

      {/* Vendor upgrade modal */}
      <AnimatePresence>
        {showVendorModal && <BecomeVendorModal onClose={() => setShowVendorModal(false)} />}
      </AnimatePresence>

      {/* Logout confirmation modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-50">
                <LogOut size={24} strokeWidth={1.75} className="text-red-500" />
              </div>
              <h3 className="text-base font-bold text-center mb-1" style={{ color: 'var(--nafa-black)' }}>
                Se déconnecter ?
              </h3>
              <p className="text-sm text-center mb-6" style={{ color: 'var(--nafa-gray-400)' }}>
                Vous serez redirigé vers la page de connexion.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutConfirm(false)} disabled={isLoggingOut}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border"
                  style={{ borderColor: 'var(--nafa-gray-200)', color: 'var(--nafa-gray-700)' }}>
                  Annuler
                </button>
                <button onClick={handleLogout} disabled={isLoggingOut}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: '#ef4444', opacity: isLoggingOut ? 0.7 : 1 }}>
                  {isLoggingOut
                    ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    : 'Déconnecter'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
