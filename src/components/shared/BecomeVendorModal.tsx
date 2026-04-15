'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, ArrowRight, CheckCircle2, Upload, Phone, MapPin, X, ChevronLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { uploadCnib } from '@/lib/api/storage';
import { useAuthStore, mapToAppUser } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const PHONE_PREFIXES = [
  { code: '+226', label: '+226 BF' },
  { code: '+225', label: '+225 CI' },
  { code: '+223', label: '+223 Mali' },
  { code: '+221', label: '+221 SN' },
  { code: '+33', label: '+33 FR' },
];

type Step = 'intro' | 'form' | 'verify';

const inputClass = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors';
const onFocusInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = 'var(--nafa-orange)';
  e.target.style.background = 'white';
};
const onBlurInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = 'var(--nafa-gray-200)';
  e.target.style.background = 'var(--nafa-gray-100)';
};

export function BecomeVendorModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [step, setStep] = useState<Step>('intro');
  const [shopName, setShopName] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+226');
  const [shopPhone, setShopPhone] = useState('');
  const [cnibFile, setCnibFile] = useState<File | null>(null);
  const [cnibFileName, setCnibFileName] = useState('');
  const [shopType, setShopType] = useState<'online' | 'physical'>('online');
  const [shopAddress, setShopAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Non authentifié');
      const user = session.user;

      // Upload CNIB
      let cnibPath: string | null = null;
      if (cnibFile) cnibPath = await uploadCnib(user.id, cnibFile);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      // Create vendor_profile
      await db.from('vendor_profiles').upsert({
        id: user.id,
        shop_name: shopName.trim(),
        shop_type: shopType,
        shop_address: shopType === 'physical' ? shopAddress.trim() : null,
        cnib_url: cnibPath,
        is_pending: true,
        is_verified: false,
      });

      // Update profile role → vendor
      await db.from('profiles').update({ role: 'vendor' }).eq('id', user.id);

      // Refresh auth store with new role immediately (no re-login needed)
      const { data: freshProfile } = await db
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (freshProfile) {
        setUser(mapToAppUser(user, freshProfile));
      }

      // Redirect directly to vendor dashboard
      router.replace('/vendor/dashboard');
    } catch (err) {
      setError((err as Error).message || 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = cnibFileName && (shopType === 'online' || shopAddress.trim()) && !isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <motion.div
        initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white overflow-hidden"
        style={{ maxHeight: '92dvh', overflowY: 'auto' }}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--nafa-gray-200)' }} />
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* Intro */}
            {step === 'intro' && (
              <motion.div key="intro" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,107,44,0.08)' }}>
                    <Store size={22} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                  </div>
                  <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }}>
                    <X size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />
                  </button>
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--nafa-black)' }}>Devenir vendeur sur NAFA</h2>
                <p className="text-sm mb-5" style={{ color: 'var(--nafa-gray-700)' }}>
                  Vendez vos produits à des milliers de clients en Afrique de l&apos;Ouest. Votre boutique sera activée immédiatement — notre équipe vérifiera votre identité sous 24-48h.
                </p>
                <div className="space-y-3 mb-6">
                  {[
                    { icon: '🏪', title: 'Votre boutique en ligne', desc: 'Créez votre espace de vente personnalisé' },
                    { icon: '📦', title: 'Gestion des commandes', desc: 'Suivez vos ventes en temps réel' },
                    { icon: '💰', title: 'Paiements sécurisés', desc: 'Recevez vos revenus via Orange Money ou Moov Money' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--nafa-gray-100)' }}>
                      <span className="text-xl flex-shrink-0">{item.icon}</span>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>{item.title}</p>
                        <p className="text-xs" style={{ color: 'var(--nafa-gray-700)' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => setStep('form')}
                  className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: 'var(--nafa-orange)' }}>
                  Commencer <ArrowRight size={16} strokeWidth={1.75} />
                </motion.button>
              </motion.div>
            )}

            {/* Form */}
            {step === 'form' && (
              <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <div className="flex items-center gap-3 mb-5">
                  <button onClick={() => setStep('intro')} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }}>
                    <ChevronLeft size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />
                  </button>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--nafa-black)' }}>Votre boutique</h2>
                    <p className="text-xs" style={{ color: 'var(--nafa-gray-700)' }}>Étape 1 sur 2</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--nafa-gray-900)' }}>
                      Nom de la boutique <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Store size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }} />
                      <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)}
                        placeholder="Ma Boutique" className={cn(inputClass, 'pl-9')}
                        style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
                        onFocus={onFocusInput} onBlur={onBlurInput} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--nafa-gray-900)' }}>Téléphone de la boutique</label>
                    <div className="flex gap-2">
                      <select value={phonePrefix} onChange={(e) => setPhonePrefix(e.target.value)}
                        className={cn(inputClass, 'w-auto flex-shrink-0 appearance-none pr-2')}
                        style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
                        onFocus={onFocusInput} onBlur={onBlurInput}>
                        {PHONE_PREFIXES.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
                      </select>
                      <div className="relative flex-1">
                        <Phone size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }} />
                        <input type="tel" value={shopPhone} onChange={(e) => setShopPhone(e.target.value)}
                          placeholder="70 00 00 00" className={cn(inputClass, 'pl-9')}
                          style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
                          onFocus={onFocusInput} onBlur={onBlurInput} />
                      </div>
                    </div>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.98 }}
                  onClick={() => { if (shopName.trim()) setStep('verify'); }}
                  disabled={!shopName.trim()}
                  className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 mt-5"
                  style={{ background: shopName.trim() ? 'var(--nafa-orange)' : 'var(--nafa-gray-300)' }}>
                  Suivant <ArrowRight size={16} strokeWidth={1.75} />
                </motion.button>
              </motion.div>
            )}

            {/* Verify */}
            {step === 'verify' && (
              <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <div className="flex items-center gap-3 mb-5">
                  <button onClick={() => setStep('form')} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }}>
                    <ChevronLeft size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />
                  </button>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--nafa-black)' }}>Vérification</h2>
                    <p className="text-xs" style={{ color: 'var(--nafa-gray-700)' }}>Étape 2 sur 2</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-xl mb-4" style={{ background: 'rgba(255,107,44,0.06)', border: '1px solid rgba(255,107,44,0.15)' }}>
                  <CheckCircle2 size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-xs" style={{ color: 'var(--nafa-gray-700)' }}>
                    Votre compte passera immédiatement en mode vendeur. L&apos;équipe NAFA vérifiera votre CNIB sous 24-48h pour certifier votre boutique.
                  </p>
                </div>
                <div className="space-y-4">
                  {/* CNIB */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>
                      CNIB / Pièce d&apos;identité <span className="text-red-500">*</span>
                    </label>
                    <label className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed transition-colors cursor-pointer"
                      style={{ borderColor: cnibFileName ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)', background: cnibFileName ? 'rgba(255,107,44,0.04)' : 'var(--nafa-gray-100)' }}>
                      <input type="file" accept="image/*,.pdf" className="sr-only"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) { setCnibFile(f); setCnibFileName(f.name); } }} />
                      {cnibFileName ? (
                        <>
                          <CheckCircle2 size={22} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                          <p className="text-xs font-medium text-center" style={{ color: 'var(--nafa-orange)' }}>{cnibFileName}</p>
                          <p className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>Cliquer pour changer</p>
                        </>
                      ) : (
                        <>
                          <Upload size={22} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                          <p className="text-xs font-medium text-center" style={{ color: 'var(--nafa-gray-700)' }}>Cliquez pour uploader votre CNIB</p>
                          <p className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>JPG, PNG ou PDF · max 5 Mo</p>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Shop type */}
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: 'var(--nafa-gray-900)' }}>Type de boutique</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([{ value: 'online', label: 'En ligne uniquement' }, { value: 'physical', label: 'Boutique physique' }] as const).map(({ value, label }) => (
                        <button key={value} type="button" onClick={() => setShopType(value)}
                          className="py-2.5 px-3 rounded-xl border-2 text-xs font-medium text-center"
                          style={{ borderColor: shopType === value ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)', background: shopType === value ? 'rgba(255,107,44,0.05)' : 'white', color: shopType === value ? 'var(--nafa-orange)' : 'var(--nafa-gray-700)' }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence>
                    {shopType === 'physical' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>
                          Adresse de la boutique <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }} />
                          <input type="text" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)}
                            placeholder="Rue 12.30, Secteur 15, Ouagadougou"
                            className={cn(inputClass, 'pl-9')}
                            style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
                            onFocus={onFocusInput} onBlur={onBlurInput} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {error && (
                    <p className="text-xs text-red-600 px-3 py-2 rounded-xl bg-red-50">{error}</p>
                  )}

                  <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                    style={{ background: canSubmit ? 'var(--nafa-orange)' : 'var(--nafa-gray-300)' }}>
                    {isLoading
                      ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      : <><ArrowRight size={16} strokeWidth={1.75} /> Devenir vendeur</>
                    }
                  </motion.button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
