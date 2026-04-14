'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ArrowDownToLine, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';
import { Skeleton } from '@/components/shared/SkeletonShimmer';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

interface Withdrawal {
  id: string;
  amount: number;
  method: string;
  status: string;
  date: string;
}

export default function VendorWalletPage() {
  const user = useAuthStore((s) => s.user);
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('orange_money');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    if (user) loadWallet();
  }, [user]);

  async function loadWallet() {
    setIsLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: wallet } = await db
      .from('wallets')
      .select('balance')
      .eq('vendor_id', user!.uid)
      .single();

    setBalance(Number(wallet?.balance ?? 0));

    const { data: wdRows } = await db
      .from('withdrawals')
      .select('id, amount, method, status, created_at')
      .eq('vendor_id', user!.uid)
      .order('created_at', { ascending: false });

    setWithdrawals(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (wdRows ?? []).map((r: any) => ({
        id: r.id,
        amount: Number(r.amount),
        method: r.method,
        status: r.status,
        date: r.created_at,
      }))
    );
    setIsLoading(false);
  }

  async function handleWithdraw() {
    const amt = Number(amount);
    if (!amt || amt <= 0 || amt > balance) return;
    setIsSubmitting(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: wd } = await db
      .from('withdrawals')
      .insert({ vendor_id: user!.uid, amount: amt, method, status: 'pending' })
      .select('id, amount, method, status, created_at')
      .single();

    if (wd) {
      setWithdrawals((prev) => [{
        id: wd.id, amount: Number(wd.amount), method: wd.method, status: wd.status, date: wd.created_at,
      }, ...prev]);
    }

    setIsSubmitting(false);
    setShowModal(false);
    setAmount('');
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--nafa-black)' }}>Mon portefeuille</h1>

      {/* Balance card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 mb-6 text-white"
        style={{ background: 'linear-gradient(135deg, var(--nafa-dark) 0%, #2a2a4e 100%)' }}>
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-10" style={{ background: 'var(--nafa-orange)' }} />
        <div className="absolute -right-4 bottom-0 w-32 h-32 rounded-full opacity-5" style={{ background: 'var(--nafa-orange)' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2 opacity-70">
            <Wallet size={16} strokeWidth={1.75} />
            <span className="text-sm font-medium">Solde disponible</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-12 w-48 rounded-xl mb-6 opacity-30" />
          ) : (
            <div className="flex items-baseline gap-2 mb-6">
              <AnimatedCounter value={balance} className="text-4xl font-black nafa-mono" />
              <span className="text-lg opacity-70">FCFA</span>
            </div>
          )}
          <p className="text-xs opacity-50">Les fonds sont crédités après livraison confirmée</p>
        </div>
      </motion.div>

      {/* Withdraw button */}
      <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        whileTap={{ scale: 0.97 }} whileHover={{ translateY: -1 }}
        onClick={() => setShowModal(true)}
        disabled={balance === 0}
        className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 mb-8"
        style={{ background: 'var(--nafa-orange)', opacity: balance === 0 ? 0.5 : 1 }}>
        <ArrowDownToLine size={18} strokeWidth={1.75} />
        Retirer des fonds
      </motion.button>

      {/* Withdrawal history */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--nafa-black)' }}>Historique des retraits</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 bg-white rounded-2xl p-4 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
                <Skeleton className="w-10 h-10 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
                <Skeleton className="h-4 w-20 rounded" />
              </div>
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--nafa-gray-200)' }}>
            <p className="text-sm" style={{ color: 'var(--nafa-gray-400)' }}>Aucun retrait effectué pour l&apos;instant</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w, i) => (
              <motion.div key={w.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                className="flex items-center gap-4 bg-white rounded-2xl p-4 border"
                style={{ borderColor: 'var(--nafa-gray-200)' }}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  w.status === 'completed' ? 'bg-green-50' : w.status === 'failed' ? 'bg-red-50' : 'bg-yellow-50'
                }`}>
                  {w.status === 'completed'
                    ? <CheckCircle2 size={20} strokeWidth={1.75} className="text-green-600" />
                    : w.status === 'failed'
                    ? <XCircle size={20} strokeWidth={1.75} className="text-red-500" />
                    : <Clock size={20} strokeWidth={1.75} className="text-yellow-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize" style={{ color: 'var(--nafa-black)' }}>
                    {w.method.replace('_', ' ')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--nafa-gray-700)' }}>
                    {new Date(w.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold nafa-mono" style={{ color: 'var(--nafa-black)' }}>
                    -{formatCurrency(w.amount, 'FCFA')}
                  </p>
                  <span className={`text-xs font-medium ${
                    w.status === 'completed' ? 'text-green-600' : w.status === 'failed' ? 'text-red-500' : 'text-yellow-600'
                  }`}>
                    {w.status === 'completed' ? 'Complété' : w.status === 'failed' ? 'Échoué' : 'En attente'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Withdraw modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--nafa-black)' }}>Retirer des fonds</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>
                    Montant (FCFA)
                  </label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                    placeholder="0" min="0" max={balance}
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none nafa-mono"
                    style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }} />
                  <p className="text-xs mt-1" style={{ color: 'var(--nafa-gray-700)' }}>
                    Disponible : {formatCurrency(balance, 'FCFA')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>Mode de retrait</label>
                  {['orange_money', 'moov_money', 'card'].map((m) => (
                    <button key={m} type="button" onClick={() => setMethod(m)}
                      className="flex items-center gap-3 w-full p-3 rounded-xl border mb-2"
                      style={{ borderColor: method === m ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)', background: method === m ? 'rgba(255,107,44,0.04)' : 'transparent' }}>
                      <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${method === m ? 'border-orange-500' : 'border-gray-300'}`}>
                        {method === m && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--nafa-orange)' }} />}
                      </span>
                      <span className="text-sm capitalize" style={{ color: 'var(--nafa-black)' }}>{m.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border text-sm font-semibold"
                  style={{ borderColor: 'var(--nafa-gray-200)', color: 'var(--nafa-gray-700)' }}>
                  Annuler
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleWithdraw}
                  disabled={isSubmitting || !amount || Number(amount) <= 0 || Number(amount) > balance}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center"
                  style={{ background: 'var(--nafa-orange)', opacity: (!amount || Number(amount) <= 0 || Number(amount) > balance) ? 0.5 : 1 }}>
                  {isSubmitting
                    ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    : 'Confirmer'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
