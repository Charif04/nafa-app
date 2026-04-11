'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CircleDollarSign, Clock, CheckCircle2, ArrowUpRight, TrendingUp } from 'lucide-react';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';
import { Skeleton } from '@/components/shared/SkeletonShimmer';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface TxRow {
  id: string;
  fullId: string;
  vendor: string;
  gross: number;
  subtotal: number;
  status: 'completed' | 'pending' | 'cancelled';
  date: string;
}

export default function AdminPaymentsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [totalCollected, setTotalCollected] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [paidToVendors, setPaidToVendors] = useState(0);
  const [commissionTotal, setCommissionTotal] = useState(0);

  useEffect(() => { loadPayments(); }, []);

  async function loadPayments() {
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
    // commission = subtotal / 11  (10% of vendor net = subtotal * 1/11)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commissionA = delivered.reduce((s: number, r: any) => s + Math.round(Number(r.subtotal) / 11), 0);

    setTotalCollected(Math.round(totalC));
    setPendingAmount(Math.round(pendingA));
    setCompletedCount(delivered.length);
    setCommissionTotal(commissionA);
    setPaidToVendors(Math.round(totalC - commissionA));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setTransactions(rows.map((r: any) => {
      const shopName = Array.isArray(r.vendor?.vendor_profiles)
        ? r.vendor.vendor_profiles[0]?.shop_name
        : r.vendor?.vendor_profiles?.shop_name;
      const status: TxRow['status'] =
        r.order_status === 'delivered' ? 'completed'
        : r.order_status === 'cancelled' ? 'cancelled'
        : 'pending';
      return {
        id: String(r.id).slice(0, 8).toUpperCase(),
        fullId: r.id,
        vendor: shopName ?? 'Boutique',
        gross: Number(r.total),
        subtotal: Number(r.subtotal),
        status,
        date: r.created_at,
      };
    }));

    setIsLoading(false);
  }

  const filtered = transactions.filter(
    (t) => filter === 'all' || t.status === filter || (filter === 'pending' && t.status === 'pending')
  );

  const KPI = [
    { label: 'Total encaissé', value: totalCollected, icon: CircleDollarSign, bg: 'bg-green-50', color: 'text-green-600', showFcfa: true },
    { label: 'En attente', value: pendingAmount, icon: Clock, bg: 'bg-yellow-50', color: 'text-yellow-600', showFcfa: true },
    { label: 'Ventes complétées', value: completedCount, icon: CheckCircle2, bg: 'bg-blue-50', color: 'text-blue-600', showFcfa: false },
    { label: 'Versé vendeurs', value: paidToVendors, icon: ArrowUpRight, bg: 'bg-orange-50', color: 'text-orange-600', showFcfa: true },
    { label: 'Commission NAFA', value: commissionTotal, icon: TrendingUp, bg: 'bg-emerald-50', color: 'text-emerald-700', showFcfa: true },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--nafa-black)' }}>Paiements</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--nafa-gray-700)' }}>Tableau de bord financier en temps réel</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
              <Skeleton className="w-9 h-9 rounded-xl mb-3" />
              <Skeleton className="h-6 w-24 rounded mb-1" />
              <Skeleton className="h-3 w-20 rounded" />
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
                {k.showFcfa && (
                  <span className="text-xs font-medium ml-0.5" style={{ color: 'var(--nafa-gray-700)' }}>FCFA</span>
                )}
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
            style={{
              background: filter === f ? 'var(--nafa-black)' : 'white',
              color: filter === f ? 'white' : 'var(--nafa-gray-700)',
              border: `1px solid ${filter === f ? 'var(--nafa-black)' : 'var(--nafa-gray-200)'}`,
            }}>
            {f === 'all' ? 'Tous' : f === 'completed' ? 'Complétés' : 'En attente'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--nafa-gray-200)' }}>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
          </div>
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
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--nafa-gray-700)' }}>
                        {new Date(t.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-xs nafa-mono font-semibold" style={{ color: 'var(--nafa-orange)' }}>
                        #{t.id}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--nafa-black)' }}>{t.vendor}</td>
                      <td className="px-4 py-3 text-sm font-bold nafa-mono" style={{ color: 'var(--nafa-black)' }}>
                        {formatCurrency(t.gross, 'FCFA')}
                      </td>
                      <td className="px-4 py-3 text-sm nafa-mono" style={{ color: 'var(--nafa-gray-700)' }}>
                        {formatCurrency(comm, 'FCFA')}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold nafa-mono" style={{ color: 'var(--nafa-green)' }}>
                        {formatCurrency(net, 'FCFA')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          t.status === 'completed' ? 'bg-green-50 text-green-700'
                          : t.status === 'cancelled' ? 'bg-red-50 text-red-600'
                          : 'bg-yellow-50 text-yellow-700'
                        }`}>
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
    </div>
  );
}
