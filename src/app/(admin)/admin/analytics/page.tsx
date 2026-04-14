'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/shared/SkeletonShimmer';

const PERIODS = ["Aujourd'hui", '7 jours', '30 jours'] as const;
type Period = typeof PERIODS[number];

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

interface ChartPoint {
  label: string;
  revenue: number;
  orders: number;
  delivered: number;
  in_progress: number;
  cancelled: number;
}

interface TopVendor { name: string; sales: number; }

const tooltipStyle = { background: 'white', border: '1px solid #EEEEEE', borderRadius: 12, fontSize: 12 };
const tickStyle = { fontSize: 11, fill: '#616161' };

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('7 jours');
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [topVendors, setTopVendors] = useState<TopVendor[]>([]);

  const loadData = useCallback(async (p: Period) => {
    setIsLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const now = new Date();

    let startDate: Date;
    if (p === "Aujourd'hui") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (p === '7 jours') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const { data: orders } = await db
      .from('orders')
      .select('id, total, order_status, vendor_id, created_at')
      .gte('created_at', startDate.toISOString());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = orders ?? [];

    // ── Build buckets ──
    const points: ChartPoint[] = [];

    if (p === "Aujourd'hui") {
      for (let h = 0; h < 24; h += 2) {
        points.push({ label: `${h}h`, revenue: 0, orders: 0, delivered: 0, in_progress: 0, cancelled: 0 });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rows.forEach((o: any) => {
        const bucket = Math.floor(new Date(o.created_at).getHours() / 2);
        if (bucket >= 0 && bucket < points.length) {
          points[bucket].revenue += Math.round(Number(o.total));
          points[bucket].orders += 1;
          if (o.order_status === 'delivered') points[bucket].delivered += 1;
          else if (o.order_status === 'cancelled') points[bucket].cancelled += 1;
          else points[bucket].in_progress += 1;
        }
      });
    } else if (p === '7 jours') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        points.push({ label: DAYS_FR[d.getDay()], revenue: 0, orders: 0, delivered: 0, in_progress: 0, cancelled: 0 });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rows.forEach((o: any) => {
        const daysAgo = Math.floor((now.getTime() - new Date(o.created_at).getTime()) / (24 * 60 * 60 * 1000));
        const idx = 6 - daysAgo;
        if (idx >= 0 && idx < points.length) {
          points[idx].revenue += Math.round(Number(o.total));
          points[idx].orders += 1;
          if (o.order_status === 'delivered') points[idx].delivered += 1;
          else if (o.order_status === 'cancelled') points[idx].cancelled += 1;
          else points[idx].in_progress += 1;
        }
      });
    } else {
      // 30 days → 4 weeks
      for (let w = 3; w >= 0; w--) {
        points.push({ label: `S${4 - w}`, revenue: 0, orders: 0, delivered: 0, in_progress: 0, cancelled: 0 });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rows.forEach((o: any) => {
        const daysAgo = Math.floor((now.getTime() - new Date(o.created_at).getTime()) / (24 * 60 * 60 * 1000));
        const weekIdx = Math.min(3, Math.floor(daysAgo / 7));
        const idx = 3 - weekIdx;
        if (idx >= 0 && idx < points.length) {
          points[idx].revenue += Math.round(Number(o.total));
          points[idx].orders += 1;
          if (o.order_status === 'delivered') points[idx].delivered += 1;
          else if (o.order_status === 'cancelled') points[idx].cancelled += 1;
          else points[idx].in_progress += 1;
        }
      });
    }

    setChartData(points);

    // ── Top vendors by order count in period ──
    const vendorCount: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows.forEach((o: any) => {
      vendorCount[o.vendor_id] = (vendorCount[o.vendor_id] || 0) + 1;
    });
    const sortedIds = Object.entries(vendorCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    if (sortedIds.length > 0) {
      const { data: vps } = await db
        .from('vendor_profiles')
        .select('id, shop_name')
        .in('id', sortedIds);

      setTopVendors(sortedIds.map((id) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name: (vps ?? []).find((v: any) => v.id === id)?.shop_name ?? 'Boutique',
        sales: vendorCount[id],
      })));
    } else {
      setTopVendors([]);
    }

    setIsLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData(period); }, [period, loadData]);

  const periodLabel = period === "Aujourd'hui" ? 'par heure'
    : period === '30 jours' ? 'par semaine'
    : 'par jour';

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--nafa-black)' }}>Graphiques & Analytics</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--nafa-gray-700)' }}>Vue d&apos;ensemble des performances</p>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-xl border p-1" style={{ borderColor: 'var(--nafa-gray-200)' }}>
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: period === p ? 'var(--nafa-black)' : 'transparent', color: period === p ? 'white' : 'var(--nafa-gray-700)' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="w-full h-[320px] rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="w-full h-[280px] rounded-2xl" />
            <Skeleton className="w-full h-[280px] rounded-2xl" />
            <Skeleton className="w-full h-[280px] rounded-2xl lg:col-span-2" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue chart */}
          <motion.div key={`rev-${period}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white rounded-2xl p-6 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
            <h2 className="text-base font-semibold mb-6" style={{ color: 'var(--nafa-black)' }}>
              Revenus {periodLabel}
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B2C" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#FF6B2C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={tickStyle} />
                <YAxis axisLine={false} tickLine={false} tick={tickStyle}
                  tickFormatter={(v: number) => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(Number(v ?? 0), 'FCFA'), 'Revenu']} />
                <Area type="monotone" dataKey="revenue" stroke="#FF6B2C" strokeWidth={2.5} fill="url(#g1)"
                  dot={false} activeDot={{ r: 5, fill: '#FF6B2C' }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Orders chart */}
          <motion.div key={`ord-${period}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
            <h2 className="text-base font-semibold mb-6" style={{ color: 'var(--nafa-black)' }}>
              Commandes {periodLabel}
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={tickStyle} />
                <YAxis axisLine={false} tickLine={false} tick={tickStyle} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="orders" name="Commandes" fill="#1A73E8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top vendors */}
          <motion.div key={`vend-${period}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
            <h2 className="text-base font-semibold mb-6" style={{ color: 'var(--nafa-black)' }}>Top vendeurs</h2>
            {topVendors.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--nafa-gray-400)' }}>Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topVendors} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={tickStyle} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                    tick={{ ...tickStyle, fontSize: 10 }} width={90} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="sales" name="Ventes" fill="#FF6B2C" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Status breakdown */}
          <motion.div key={`stat-${period}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-2xl p-6 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
            <h2 className="text-base font-semibold mb-6" style={{ color: 'var(--nafa-black)' }}>
              Statut commandes {periodLabel}
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={tickStyle} />
                <YAxis axisLine={false} tickLine={false} tick={tickStyle} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="delivered" name="Livré" stackId="a" fill="#00C853" />
                <Bar dataKey="in_progress" name="En cours" stackId="a" fill="#FF6B2C" />
                <Bar dataKey="cancelled" name="Annulé" stackId="a" fill="#FF1744" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}
    </div>
  );
}
