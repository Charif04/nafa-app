'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, BarChart2, Wallet } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';
import { Skeleton } from '@/components/shared/SkeletonShimmer';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

const COMMISSION_RATE = 0.10;
const MONTH_LABELS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

interface ProductRevenue {
  title: string;
  unitsSold: number;
  gross: number;
}

interface MonthPoint { month: string; revenue: number; }

export default function VendorRevenuePage() {
  const user = useAuthStore((s) => s.user);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [chartData, setChartData] = useState<MonthPoint[]>([]);
  const [productRevenues, setProductRevenues] = useState<ProductRevenue[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    if (user) loadRevenue();
  }, [user]);

  async function loadRevenue() {
    setIsLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // All completed orders for this vendor
    const { data: orders } = await db
      .from('orders')
      .select('subtotal, created_at, items:order_items(title, price, quantity)')
      .eq('vendor_id', user!.uid)
      .neq('order_status', 'cancelled');

    if (!orders || orders.length === 0) {
      setIsLoading(false);
      return;
    }

    // Total revenue (vendor net = subtotal / 1.1)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total = orders.reduce((s: number, o: any) => s + Number(o.subtotal), 0);
    setTotalRevenue(Math.round(total / 1.1));

    // This month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const monthOrders = orders.filter((o: any) => o.created_at >= monthStart);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const month = monthOrders.reduce((s: number, o: any) => s + Number(o.subtotal), 0);
    setMonthRevenue(Math.round(month / 1.1));

    // Chart: last 6 months
    const monthMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = 0;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orders.forEach((o: any) => {
      const key = o.created_at.slice(0, 7); // YYYY-MM
      if (key in monthMap) monthMap[key] += Math.round(Number(o.subtotal) / 1.1);
    });
    setChartData(
      Object.entries(monthMap).map(([key, revenue]) => ({
        month: MONTH_LABELS_FR[parseInt(key.split('-')[1]) - 1],
        revenue,
      }))
    );

    // Revenue by product
    const productMap: Record<string, { unitsSold: number; gross: number }> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orders.forEach((o: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (o.items ?? []).forEach((item: any) => {
        const title = item.title;
        if (!productMap[title]) productMap[title] = { unitsSold: 0, gross: 0 };
        productMap[title].unitsSold += item.quantity;
        productMap[title].gross += Math.round(Number(item.price) * item.quantity);
      });
    });
    setProductRevenues(
      Object.entries(productMap)
        .map(([title, v]) => ({ title, ...v }))
        .sort((a, b) => b.gross - a.gross)
        .slice(0, 10)
    );

    setIsLoading(false);
  }

  // order.subtotal = client price (vendor price × 1.1)
  // monthRevenue = Math.round(sum(subtotal) / 1.1) = total vendor earnings (their set prices)
  // NAFA's markup = monthRevenue × 10% (charged on top to clients, not deducted from vendor)
  const nafaMarkup = Math.round(monthRevenue * COMMISSION_RATE);
  const clientTotal = monthRevenue + nafaMarkup; // total processed through NAFA

  const kpiCards = [
    { label: 'CA total (net vendeur)', value: totalRevenue, icon: TrendingUp, accent: false },
    { label: 'Volume client ce mois', value: clientTotal, icon: BarChart2, accent: false },
    { label: 'Markup NAFA (10%)', value: nafaMarkup, icon: DollarSign, accent: true },
    { label: 'Vos revenus ce mois', value: monthRevenue, icon: Wallet, accent: false },
  ];

  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
  const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold mb-8" style={{ color: 'var(--nafa-black)' }}>
        Revenus
      </motion.h1>

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
              <Skeleton className="w-9 h-9 rounded-xl mb-3" />
              <Skeleton className="h-3 w-24 rounded mb-2" />
              <Skeleton className="h-6 w-32 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpiCards.map((card) => (
            <motion.div key={card.label} variants={cardVariants}
              className="bg-white rounded-2xl p-5 border"
              style={{ borderColor: card.accent ? 'var(--nafa-orange)' : 'var(--nafa-gray-200)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: card.accent ? 'rgba(255,107,44,0.10)' : 'var(--nafa-gray-100)' }}>
                <card.icon size={18} strokeWidth={1.75}
                  style={{ color: card.accent ? 'var(--nafa-orange)' : 'var(--nafa-gray-700)' }} />
              </div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--nafa-gray-700)' }}>{card.label}</p>
              <div className="flex items-baseline gap-1"
                style={{ color: card.accent ? 'var(--nafa-orange)' : 'var(--nafa-black)' }}>
                <AnimatedCounter value={card.value} className="text-xl font-black" />
                <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>FCFA</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl border p-6 mb-8" style={{ borderColor: 'var(--nafa-gray-200)' }}>
        <h2 className="text-base font-semibold mb-6" style={{ color: 'var(--nafa-black)' }}>
          Évolution du CA net (6 derniers mois)
        </h2>
        {isLoading ? (
          <Skeleton className="w-full h-[220px] rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--nafa-orange)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--nafa-orange)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--nafa-gray-200)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--nafa-gray-400)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--nafa-gray-400)' }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`} width={40} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid var(--nafa-gray-200)', fontSize: 12 }}
                formatter={(v) => [formatCurrency(Number(v ?? 0), 'FCFA'), 'CA net']} />
              <Area type="monotone" dataKey="revenue" stroke="var(--nafa-orange)" strokeWidth={2} fill="url(#revGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Products table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--nafa-gray-200)' }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--nafa-gray-200)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--nafa-black)' }}>Revenus par produit</h2>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
          </div>
        ) : productRevenues.length === 0 ? (
          <p className="px-6 py-10 text-sm text-center" style={{ color: 'var(--nafa-gray-400)' }}>Aucune vente pour l&apos;instant</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr style={{ background: 'var(--nafa-gray-100)' }}>
                  {['Produit', 'Unités vendues', 'Payé par client', 'Markup NAFA (10%)', 'Vos revenus'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productRevenues.map((p, i) => {
                  // p.gross = item.price × qty = vendor price (raw, pre-markup)
                  // NAFA adds 10% on top for clients — vendor keeps their full price
                  const markup = Math.round(p.gross * COMMISSION_RATE);
                  const clientPaid = p.gross + markup;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--nafa-gray-100)' }}>
                      <td className="px-5 py-3.5 text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>{p.title}</td>
                      <td className="px-5 py-3.5 text-sm nafa-mono" style={{ color: 'var(--nafa-gray-700)' }}>{p.unitsSold}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold nafa-mono" style={{ color: 'var(--nafa-black)' }}>{formatCurrency(clientPaid, 'FCFA')}</td>
                      <td className="px-5 py-3.5 text-sm nafa-mono" style={{ color: 'var(--nafa-orange)' }}>{formatCurrency(markup, 'FCFA')}</td>
                      <td className="px-5 py-3.5 text-sm font-bold nafa-mono text-green-600">{formatCurrency(p.gross, 'FCFA')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
