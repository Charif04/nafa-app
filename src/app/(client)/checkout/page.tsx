'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, MapPin, CreditCard, CheckCircle2, ArrowRight,
  Smartphone, Phone, Lock, Calendar,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cartStore';
// useCartStore.getState() used in handleConfirm for vendor groups
import { formatCurrency, clientPrice } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { createOrder } from '@/lib/api/orders';
import type { PaymentMethod } from '@/types';

type Step = 'address' | 'payment' | 'summary' | 'success';
const STEPS: Step[] = ['address', 'payment', 'summary', 'success'];
const STEP_LABELS: Record<Step, string> = { address: 'Adresse', payment: 'Paiement', summary: 'Récap', success: 'Succès' };

const PAYMENT_METHODS: { id: PaymentMethod; label: string; description: string; color: string; bg: string }[] = [
  { id: 'orange_money', label: 'Orange Money', description: 'Paiement mobile Orange', color: '#FF6600', bg: '#FFF3EB' },
  { id: 'moov_money', label: 'Moov Money', description: 'Paiement mobile Moov', color: '#0099CC', bg: '#E6F5FB' },
  { id: 'card', label: 'Carte bancaire', description: 'Visa, Mastercard', color: '#1a1a2e', bg: '#F0F0F5' },
];

const PHONE_PREFIXES = [
  { code: '+226', label: '+226 BF' },
  { code: '+225', label: '+225 CI' },
  { code: '+223', label: '+223 Mali' },
  { code: '+221', label: '+221 SN' },
  { code: '+227', label: '+227 Niger' },
];

const inputClass = 'w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors';
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = 'var(--nafa-orange)';
  e.target.style.background = 'white';
};
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = 'var(--nafa-gray-200)';
  e.target.style.background = 'var(--nafa-gray-100)';
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, getDeliveryFee, getTotal, clearCart } = useCartStore();
  const [step, setStep] = useState<Step>('address');
  const [isLoading, setIsLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [realOrderId, setRealOrderId] = useState<string | null>(null);

  // Address
  const [address, setAddress] = useState({ street: '', city: 'Ouagadougou', region: '', country: 'Burkina Faso' });

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('orange_money');
  const [mobilePrefix, setMobilePrefix] = useState('+226');
  const [mobilePhone, setMobilePhone] = useState('');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });

  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();
  const stepIndex = STEPS.indexOf(step);

  const withTimeout = <T,>(p: Promise<T>, ms = 15000): Promise<T> =>
    Promise.race([
      p,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Délai dépassé. Vérifiez votre connexion et réessayez.')), ms)
      ),
    ]);

  const handleConfirm = async () => {
    setIsLoading(true);
    setOrderError('');
    try {
      const { data: { user } } = await withTimeout(supabase.auth.getUser());

      if (!user) {
        setOrderError('Vous devez être connecté pour passer une commande.');
        return;
      }

      if (items.length > 0) {
        // Create one order per vendor group
        const vendorGroups = useCartStore.getState().getVendorGroups();
        let firstId: string | null = null;
        for (const group of vendorGroups) {
          const oid = await withTimeout(createOrder({
            clientId: user.id,
            vendorId: group.vendorId,
            items: group.items.map((item) => ({
              productId: item.productId,
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              image: item.image,
            })),
            subtotal: group.subtotal,
            deliveryFee: group.deliveryFee,
            total: group.total,
            currency: 'FCFA',
            deliveryStreet: address.street,
            deliveryCity: address.city,
            deliveryRegion: address.region,
            deliveryCountry: address.country,
            paymentMethod,
          }));
          if (!firstId) firstId = oid;
        }
        setRealOrderId(firstId);
      }

      clearCart();
      setStep('success');
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Erreur lors de la commande. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Card number formatting
  const formatCardNumber = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    return digits.length >= 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const canProceedPayment = paymentMethod === 'card'
    ? card.number.replace(/\s/g, '').length === 16 && card.expiry.length === 5 && card.cvv.length >= 3 && card.name.trim().length > 0
    : mobilePhone.trim().length >= 6;

  const selectedPM = PAYMENT_METHODS.find((p) => p.id === paymentMethod)!;

  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-white)' }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 md:px-6 py-4 border-b max-w-2xl mx-auto" style={{ borderColor: 'var(--nafa-gray-200)' }}>
        {step !== 'success' && (
          <button onClick={() => stepIndex > 0 ? setStep(STEPS[stepIndex - 1] as Step) : router.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }} aria-label="Retour">
            <ChevronLeft size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-black)' }} />
          </button>
        )}
        <h1 className="text-base font-bold" style={{ color: 'var(--nafa-black)' }}>
          {step === 'success' ? 'Commande confirmée' : 'Finaliser la commande'}
        </h1>
      </header>

      {/* Step indicators */}
      {step !== 'success' && (
        <div className="flex items-center px-6 md:px-8 py-4 gap-2 max-w-2xl mx-auto">
          {(['address', 'payment', 'summary'] as Step[]).map((s, i) => {
            const idx = STEPS.indexOf(s);
            const current = STEPS.indexOf(step);
            const done = idx < current;
            const active = idx === current;
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${done ? 'bg-green-500 text-white' : active ? 'text-white' : 'text-gray-400'}`}
                    style={active ? { background: 'var(--nafa-orange)' } : done ? {} : { background: 'var(--nafa-gray-200)' }}>
                    {done ? <CheckCircle2 size={14} strokeWidth={2} /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${active ? '' : 'opacity-50'}`}
                    style={active ? { color: 'var(--nafa-orange)' } : { color: 'var(--nafa-gray-700)' }}>
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {i < 2 && <div className="flex-1 h-0.5 rounded-full" style={{ background: done ? 'var(--nafa-green)' : 'var(--nafa-gray-200)' }} />}
              </div>
            );
          })}
        </div>
      )}

      <div className="px-4 md:px-6 pb-32 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">

          {/* ── Adresse ── */}
          {step === 'address' && (
            <motion.div key="address" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="flex items-center gap-2 mb-6 mt-2">
                <MapPin size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                <h2 className="text-base font-semibold" style={{ color: 'var(--nafa-black)' }}>Adresse de livraison</h2>
              </div>
              <div className="space-y-4">
                {([
                  { label: 'Rue / Quartier', key: 'street', placeholder: 'Ex: Rue 12.30, Secteur 15' },
                  { label: 'Ville', key: 'city', placeholder: 'Ouagadougou' },
                  { label: 'Région', key: 'region', placeholder: 'Centre' },
                  { label: 'Pays', key: 'country', placeholder: 'Burkina Faso' },
                ] as const).map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>
                      {label} <span className="text-red-500">*</span>
                    </label>
                    <input type="text" required value={address[key]}
                      onChange={(e) => setAddress((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className={inputClass}
                      style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
                      onFocus={onFocus} onBlur={onBlur}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Paiement ── */}
          {step === 'payment' && (
            <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="flex items-center gap-2 mb-6 mt-2">
                <CreditCard size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                <h2 className="text-base font-semibold" style={{ color: 'var(--nafa-black)' }}>Mode de paiement</h2>
              </div>

              {/* Method selector */}
              <div className="space-y-3 mb-6">
                {PAYMENT_METHODS.map((pm) => (
                  <motion.button key={pm.id} whileTap={{ scale: 0.99 }} onClick={() => setPaymentMethod(pm.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left"
                    style={{
                      borderColor: paymentMethod === pm.id ? pm.color : 'var(--nafa-gray-200)',
                      background: paymentMethod === pm.id ? pm.bg : 'white',
                    }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: paymentMethod === pm.id ? pm.color : 'var(--nafa-gray-100)' }}>
                      {pm.id === 'card'
                        ? <CreditCard size={18} strokeWidth={1.75} style={{ color: paymentMethod === pm.id ? 'white' : 'var(--nafa-gray-700)' }} />
                        : <Smartphone size={18} strokeWidth={1.75} style={{ color: paymentMethod === pm.id ? 'white' : 'var(--nafa-gray-700)' }} />
                      }
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: pm.color }}>{pm.label}</p>
                      <p className="text-xs" style={{ color: 'var(--nafa-gray-700)' }}>{pm.description}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: paymentMethod === pm.id ? pm.color : 'var(--nafa-gray-300)' }}>
                      {paymentMethod === pm.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: pm.color }} />}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Dynamic form */}
              <AnimatePresence mode="wait">

                {/* Orange Money / Moov Money */}
                {(paymentMethod === 'orange_money' || paymentMethod === 'moov_money') && (
                  <motion.div key="mobile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                    className="p-4 rounded-2xl" style={{ background: 'var(--nafa-gray-100)' }}>
                    <p className="text-xs font-semibold mb-3" style={{ color: 'var(--nafa-gray-700)' }}>
                      Numéro {paymentMethod === 'orange_money' ? 'Orange' : 'Moov'} à débiter
                    </p>
                    <div className="flex gap-2">
                      <select value={mobilePrefix} onChange={(e) => setMobilePrefix(e.target.value)}
                        className="px-3 py-3 rounded-xl border text-sm outline-none appearance-none flex-shrink-0"
                        style={{ borderColor: 'var(--nafa-gray-200)', background: 'white' }}
                        onFocus={onFocus} onBlur={onBlur}>
                        {PHONE_PREFIXES.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
                      </select>
                      <div className="relative flex-1">
                        <Phone size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }} />
                        <input type="tel" value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="70 00 00 00"
                          className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors"
                          style={{ borderColor: 'var(--nafa-gray-200)', background: 'white' }}
                          onFocus={onFocus} onBlur={onBlur} />
                      </div>
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'var(--nafa-gray-400)' }}>
                      Vous recevrez un code de confirmation par SMS pour valider le paiement.
                    </p>
                  </motion.div>
                )}

                {/* Card */}
                {paymentMethod === 'card' && (
                  <motion.div key="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                    className="p-4 rounded-2xl space-y-3" style={{ background: 'var(--nafa-gray-100)' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--nafa-gray-700)' }}>Informations de la carte</p>

                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--nafa-gray-900)' }}>Nom sur la carte</label>
                      <input type="text" value={card.name} onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                        placeholder="AMADOU DIALLO"
                        className={inputClass} style={{ borderColor: 'var(--nafa-gray-200)', background: 'white' }}
                        onFocus={onFocus} onBlur={onBlur} />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--nafa-gray-900)' }}>Numéro de carte</label>
                      <div className="relative">
                        <CreditCard size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }} />
                        <input type="text" inputMode="numeric" value={card.number}
                          onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
                          placeholder="1234 5678 9012 3456"
                          className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors nafa-mono"
                          style={{ borderColor: 'var(--nafa-gray-200)', background: 'white' }}
                          onFocus={onFocus} onBlur={onBlur} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--nafa-gray-900)' }}>Date d'expiration</label>
                        <div className="relative">
                          <Calendar size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }} />
                          <input type="text" inputMode="numeric" value={card.expiry}
                            onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                            placeholder="MM/AA"
                            className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors nafa-mono"
                            style={{ borderColor: 'var(--nafa-gray-200)', background: 'white' }}
                            onFocus={onFocus} onBlur={onBlur} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--nafa-gray-900)' }}>CVV</label>
                        <div className="relative">
                          <Lock size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }} />
                          <input type="password" inputMode="numeric" value={card.cvv}
                            onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                            placeholder="•••"
                            className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors nafa-mono"
                            style={{ borderColor: 'var(--nafa-gray-200)', background: 'white' }}
                            onFocus={onFocus} onBlur={onBlur} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <Lock size={11} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                      <p className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>Paiement sécurisé — vos données sont chiffrées</p>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Récapitulatif ── */}
          {step === 'summary' && (
            <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <h2 className="text-base font-semibold mb-6 mt-2" style={{ color: 'var(--nafa-black)' }}>Récapitulatif</h2>
              <div className="space-y-4">
                {/* Produits */}
                <div className="p-4 rounded-2xl" style={{ background: 'var(--nafa-gray-100)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--nafa-gray-400)' }}>
                    Produits ({items.length})
                  </p>
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm mb-2">
                      <span className="truncate flex-1" style={{ color: 'var(--nafa-gray-700)' }}>
                        {item.title} ×{item.quantity}
                      </span>
                      <span className="nafa-mono font-medium ml-3" style={{ color: 'var(--nafa-black)' }}>
                        {formatCurrency(clientPrice(item.price) * item.quantity, 'FCFA')}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-3 space-y-1.5" style={{ borderColor: 'var(--nafa-gray-200)' }}>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--nafa-gray-700)' }}>Sous-total</span>
                      <span className="nafa-mono" style={{ color: 'var(--nafa-black)' }}>{formatCurrency(subtotal, 'FCFA')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--nafa-gray-700)' }}>Livraison</span>
                      <span className="nafa-mono" style={{ color: deliveryFee === 0 ? 'var(--nafa-green)' : 'var(--nafa-black)' }}>
                        {deliveryFee === 0 ? 'GRATUIT' : formatCurrency(deliveryFee, 'FCFA')}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold pt-1">
                      <span style={{ color: 'var(--nafa-black)' }}>Total</span>
                      <span className="nafa-mono" style={{ color: 'var(--nafa-orange)' }}>{formatCurrency(total, 'FCFA')}</span>
                    </div>
                  </div>
                </div>

                {/* Livraison */}
                <div className="p-4 rounded-2xl" style={{ background: 'var(--nafa-gray-100)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--nafa-gray-400)' }}>Adresse de livraison</p>
                  <p className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>
                    {address.street && `${address.street}, `}{address.city}
                    {address.region && `, ${address.region}`} — {address.country}
                  </p>
                </div>

                {/* Paiement */}
                <div className="p-4 rounded-2xl flex items-center gap-3" style={{ background: 'var(--nafa-gray-100)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: selectedPM.color }}>
                    {paymentMethod === 'card'
                      ? <CreditCard size={16} strokeWidth={1.75} className="text-white" />
                      : <Smartphone size={16} strokeWidth={1.75} className="text-white" />
                    }
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>Paiement</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>
                      {selectedPM.label}
                      {paymentMethod !== 'card' && mobilePhone && ` · ${mobilePrefix} ${mobilePhone}`}
                      {paymentMethod === 'card' && card.number && ` · •••• ${card.number.replace(/\s/g, '').slice(-4)}`}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Succès ── */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center py-12">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-green-100">
                <CheckCircle2 size={40} strokeWidth={1.5} className="text-green-500" />
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-2xl font-bold mb-2" style={{ color: 'var(--nafa-black)' }}>
                Commande confirmée !
              </motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="text-sm mb-8" style={{ color: 'var(--nafa-gray-700)' }}>
                Votre commande a été enregistrée et le vendeur va la confirmer sous peu.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                className="w-full p-5 rounded-2xl mb-8 text-left" style={{ background: 'var(--nafa-gray-100)' }}>
                {[
                  { label: 'N° Commande', value: realOrderId ? `#${realOrderId.slice(0, 8).toUpperCase()}` : '—' },
                  { label: 'Montant payé', value: formatCurrency(total, 'FCFA') },
                  { label: 'Moyen de paiement', value: selectedPM.label },
                  { label: 'Statut', value: 'En attente vendeur' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'var(--nafa-gray-200)' }}>
                    <span className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>{label}</span>
                    <span className="text-sm font-semibold nafa-mono" style={{ color: 'var(--nafa-black)' }}>{value}</span>
                  </div>
                ))}
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="flex flex-col gap-3 w-full">
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => router.push(realOrderId ? `/profile/orders/${realOrderId}` : '/profile/orders')}
                  className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: 'var(--nafa-orange)' }}>
                  Suivre ma commande <ArrowRight size={16} strokeWidth={1.75} />
                </motion.button>
                <button onClick={() => router.push('/home')}
                  className="w-full py-3 rounded-xl text-sm font-medium" style={{ color: 'var(--nafa-gray-700)' }}>
                  Retour à l&apos;accueil
                </button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* CTA fixe */}
      {step !== 'success' && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0"
          style={{ background: 'linear-gradient(to top, white 85%, transparent)' }}>
          <div className="max-w-2xl mx-auto px-4 md:px-6 pb-6 pt-4">
            {orderError && (
              <div className="mb-3 px-4 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--nafa-error)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {orderError}
              </div>
            )}
            <motion.button whileTap={{ scale: 0.98 }}
              disabled={isLoading || (step === 'payment' && !canProceedPayment)}
              onClick={() => {
                if (step === 'address') setStep('payment');
                else if (step === 'payment') setStep('summary');
                else handleConfirm();
              }}
              className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-opacity"
              style={{
                background: 'var(--nafa-orange)',
                opacity: step === 'payment' && !canProceedPayment ? 0.5 : 1,
              }}>
              {isLoading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  {step === 'summary' ? 'Confirmer la commande' : 'Continuer'}
                  <ArrowRight size={18} strokeWidth={1.75} />
                </>
              )}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
