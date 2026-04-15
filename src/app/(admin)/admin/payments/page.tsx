'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CircleDollarSign, Clock, CheckCircle2, ArrowUpRight, TrendingUp,
  ArrowDownToLine, Check, X,
} from 'lucide-react';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';
import { Skeleton } from '@/components/shared/SkeletonShimmer';
import { formatCurrency, formatOrderId } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// ─── Transactions tab ──────────────────────────────────────────────────────────

interface TxRow {
  id: string;
  fullId: string;
  vendor: string;
  gross: number;
  subtotal: number;
  status: 'completed' | 'pending' | 'cancelled';
  date: string;
}

function TransactionsTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [totalCollected, setTotalCollected] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [paidToVendors, setPaidToVendors] = useState(0);
  const [commissionTotal, setCommissionTotal] = useState(0);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/immutability

  async function load() {
    setIsLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: rows } = await db
      .from('orders')
      .select(`
        id, subtotal, delivery_fee, total, order_status, created_at,
        vendor:profiles!orders_vendor_id_fkey(vendor_profiles(shop_name))
      `)
      .order('created_at', { ascending: false });

    if (!rows) { setIsLoading(false); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delivered = rows.filter((r: any) => r.order_status === 'delivered');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notDone = rows.filter((r: any) => r.order_status !== 'delivered' && r.order_status !== 'cancelled');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalC = delivered.reduce((s: number, r: any) => s + Number(r.total), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pendingA = notDone.reduce((s: number, r: any) => s + Number(r.total), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commA = delivered.reduce((s: number, r: any) => s + Math.round(Number(r.subtotal) / 11), 0);

    setTotalCollected(Math.round(totalC));
    setPendingAmount(Math.round(pendingA));
    setCompletedCount(delivered.length);
    setCommissionTotal(commA);
    setPaidToVendors(Math.round(totalC - commA));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setTransactions(rows.map((r: any) => {
      const shopName = Array.isArray(r.vendor?.vendor_profiles)
        ? r.vendor.vendor_profiles[0]?.shop_name
        : r.vendor?.vendor_profiles?.shop_name;
      const status: TxRow['status'] =
        r.order_status === 'delivered' ? 'completed'
        : r.order_status === 'cancelled' ? 'cancelled' : 'pending';
      return { id: String(r.id).slice(0, 8).toUpperCase(), fullId: r.id, vendor: shopName ?? 'Boutique',
        gross: Number(r.total), subtotal: Number(r.subtotal), status, date: r.created_at };
    }));
    setIsLoading(false);
  }

  const filtered = transactions.filter((t) =>
    filter === 'all' || t.status === filter
  );

  const KPI = [
    { label: 'Total encaissé', value: totalCollected, icon: CircleDollarSign, bg: 'bg-green-50', color: 'text-green-600', fcfa: true },
    { label: 'En attente', value: pendingAmount, icon: Clock, bg: 'bg-yellow-50', color: 'text-yellow-600', fcfa: true },
    { label: 'Ventes complétées', value: completedCount, icon: CheckCircle2, bg: 'bg-blue-50', color: 'text-blue-600', fcfa: false },
    { label: 'Versé vendeurs', value: paidToVendors, icon: ArrowUpRight, bg: 'bg-orange-50', color: 'text-orange-600', fcfa: true },
    { label: 'Commission NAFA', value: commissionTotal, icon: TrendingUp, bg: 'bg-emerald-50', color: 'text-emerald-700', fcfa: true },
  ];

  return (
    <>
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
              <Skeleton className="w-9 h-9 rounded-xl mb-3" /><Skeleton className="h-6 w-24 rounded mb-1" /><Skeleton className="h-3 w-20 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {KPI.map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white rounded-2xl p-4 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${k.bg}`}>
                <k.icon size={18} strokeWidth={1.75} className={k.color} />
              </div>
              <p className="text-xl font-black nafa-mono" style={{ color: 'var(--nafa-black)' }}>
                <AnimatedCounter value={k.value} />
                {k.fcfa && <span className="text-xs font-medium ml-0.5" style={{ color: 'var(--nafa-gray-700)' }}>FCFA</span>}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--nafa-gray-700)' }}>{k.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {(['all', 'completed', 'pending'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: filter === f ? 'var(--nafa-black)' : 'white', color: filter === f ? 'white' : 'var(--nafa-gray-700)', border: `1px solid ${filter === f ? 'var(--nafa-black)' : 'var(--nafa-gray-200)'}` }}>
            {f === 'all' ? 'Tous' : f === 'completed' ? 'Complétés' : 'En attente'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--nafa-gray-200)' }}>
        {isLoading ? (
          <div className="p-6 space-y-3">{[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="px-6 py-10 text-sm text-center" style={{ color: 'var(--nafa-gray-400)' }}>Aucune transaction</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr style={{ background: 'var(--nafa-gray-100)', borderBottom: '1px solid var(--nafa-gray-200)' }}>
                  {['Date', 'Commande', 'Vendeur', 'Total client', 'Commission 10%', 'Net vendeur', 'Statut'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const comm = Math.round(t.subtotal / 11);
                  const net = Math.round(t.subtotal * 10 / 11);
                  return (
                    <motion.tr key={t.fullId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      style={{ borderBottom: '1px solid var(--nafa-gray-100)' }}>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--nafa-gray-700)' }}>{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3 text-xs nafa-mono font-semibold" style={{ color: 'var(--nafa-orange)' }}>{formatOrderId(t.id)}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--nafa-black)' }}>{t.vendor}</td>
                      <td className="px-4 py-3 text-sm font-bold nafa-mono" style={{ color: 'var(--nafa-black)' }}>{formatCurrency(t.gross, 'FCFA')}</td>
                      <td className="px-4 py-3 text-sm nafa-mono" style={{ color: 'var(--nafa-gray-700)' }}>{formatCurrency(comm, 'FCFA')}</td>
                      <td className="px-4 py-3 text-sm font-bold nafa-mono" style={{ color: 'var(--nafa-green)' }}>{formatCurrency(net, 'FCFA')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.status === 'completed' ? 'bg-green-50 text-green-700' : t.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'}`}>
                          {t.status === 'completed' ? 'Complété' : t.status === 'cancelled' ? 'Annulé' : 'En attente'}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Withdrawals tab ───────────────────────────────────────────────────────────

interface WdRow {
  id: string;
  vendor: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
}

function WithdrawalsTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<WdRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/immutability

  async function load() {
    setIsLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: rows } = await db
      .from('withdrawals')
      .select(`
        id, amount, method, status, created_at,
        vendor:profiles!withdrawals_vendor_id_fkey(
          first_name, last_name,
          vendor_profiles(shop_name)
        )
      `)
      .order('created_at', { ascending: false });

    if (rows) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setWithdrawals(rows.map((r: any) => {
        const vp = Array.isArray(r.vendor?.vendor_profiles)
          ? r.vendor.vendor_profiles[0]
          : r.vendor?.vendor_profiles;
        const name = vp?.shop_name ?? (r.vendor ? `${r.vendor.first_name} ${r.vendor.last_name}`.trim() : 'Vendeur');
        return { id: r.id, vendor: name, amount: Number(r.amount), method: r.method, status: r.status, date: r.created_at };
      }));
    }
    setIsLoading(false);
  }

  async function updateStatus(id: string, status: 'completed' | 'failed') {
    setProcessing(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('withdrawals').update({ status }).eq('id', id);
    setWithdrawals((prev) => prev.map((w) => w.id === id ? { ...w, status } : w));
    setProcessing(null);
  }

  const filtered = withdrawals.filter((w) =>
    filter === 'all' || w.status === filter || (filter === 'pending' && w.status === 'pending')
  );

  const pendingCount = withdrawals.filter((w) => w.status === 'pending').length;
  const pendingTotal = withdrawals.filter((w) => w.status === 'pending').reduce((s, w) => s + w.amount, 0);

  return (
    <>
      {/* Summary */}
      {!isLoading && pendingCount > 0 && (
        <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl"
          style={{ background: 'rgba(255,107,44,0.07)', border: '1px solid rgba(255,107,44,0.2)' }}>
          <ArrowDownToLine size={20} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--nafa-black)' }}>
              {pendingCount} retrait{pendingCount > 1 ? 's' : ''} en attente d&apos;approbation
            </p>
            <p className="text-xs" style={{ color: 'var(--nafa-gray-700)' }}>
              Total : {formatCurrency(pendingTotal, 'FCFA')}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {(['all', 'pending', 'completed'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: filter === f ? 'var(--nafa-black)' : 'white', color: filter === f ? 'white' : 'var(--nafa-gray-700)', border: `1px solid ${filter === f ? 'var(--nafa-black)' : 'var(--nafa-gray-200)'}` }}>
            {f === 'all' ? 'Tous' : f === 'pending' ? `En attente${pendingCount > 0 ? ` (${pendingCount})` : ''}` : 'Traités'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--nafa-gray-200)' }}>
        {isLoading ? (
          <div className="p-6 space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="px-6 py-10 text-sm text-center" style={{ color: 'var(--nafa-gray-400)' }}>Aucun retrait</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr style={{ background: 'var(--nafa-gray-100)', borderBottom: '1px solid var(--nafa-gray-200)' }}>
                  {['Date', 'Vendeur', 'Montant', 'Méthode', 'Statut', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((w, i) => (
                  <motion.tr key={w.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: '1px solid var(--nafa-gray-100)' }}>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--nafa-gray-700)' }}>
                      {new Date(w.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>{w.vendor}</td>
                    <td className="px-4 py-3 text-sm font-bold nafa-mono" style={{ color: 'var(--nafa-black)' }}>
                      {formatCurrency(w.amount, 'FCFA')}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize" style={{ color: 'var(--nafa-gray-700)' }}>
                      {w.method.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        w.status === 'completed' ? 'bg-green-50 text-green-700'
                        : w.status === 'failed' ? 'bg-red-50 text-red-600'
                        : 'bg-yellow-50 text-yellow-700'}`}>
                        {w.status === 'completed' ? 'Approuvé' : w.status === 'failed' ? 'Rejeté' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {w.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <motion.button whileTap={{ scale: 0.95 }}
                            disabled={processing === w.id}
                            onClick={() => updateStatus(w.id, 'completed')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                            style={{ background: 'var(--nafa-green)' }}>
                            {processing === w.id
                              ? <div className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />
                              : <><Check size={12} strokeWidth={2} />Approuver</>}
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.95 }}
                            disabled={processing === w.id}
                            onClick={() => updateStatus(w.id, 'failed')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-error)' }}>
                            <X size={12} strokeWidth={2} />Rejeter
                          </motion.button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPaymentsPage() {
  const [tab, setTab] = useState<'transactions' | 'withdrawals'>('transactions');

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--nafa-black)' }}>Paiements</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--nafa-gray-700)' }}>Tableau de bord financier en temps réel</p>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-white rounded-xl border p-1 w-fit mb-8" style={{ borderColor: 'var(--nafa-gray-200)' }}>
        {(['transactions', 'withdrawals'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: tab === t ? 'var(--nafa-black)' : 'transparent', color: tab === t ? 'white' : 'var(--nafa-gray-700)' }}>
            {t === 'transactions' ? 'Transactions' : 'Retraits vendeurs'}
          </button>
        ))}
      </div>

      {tab === 'transactions' ? <TransactionsTab /> : <WithdrawalsTab />}
    </div>
  );
}
