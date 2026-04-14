'use client';
import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  DollarSign, Package, UserPlus, Store, Truck,
  TrendingUp, ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/shared/SkeletonShimmer';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { fetchAdminOrders, mapOrder } from '@/lib/api/orders';
import type { Order } from '@/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface AdminStats {
  revenueToday: number;
  ordersToday: number;
  newUsersToday: number;
  activeVendors: number;
  inTransit: number;
}

interface ChartPoint {
  day: string;
  revenue: number;
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const DAY_LABELS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setIsLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Today boundaries
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Revenue today (sum of all orders placed today, not cancelled)
    const { data: todayOrders } = await db
      .from('orders')
      .select('total')
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString())
      .neq('order_status', 'cancelled');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const revenueToday = (todayOrders ?? []).reduce((sum: number, r: any) => sum + Number(r.total), 0);
    const ordersToday = (todayOrders ?? []).length;

    // New users today
    const { count: newUsersToday } = await db
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    // Active vendors (not suspended)
    const { count: activeVendors } = await db
      .from('vendor_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_suspended', false);

    // Orders in transit to warehouse
    const { count: inTransit } = await db
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('order_status', 'in_transit_warehouse');

    setStats({
      revenueToday,
      ordersToday,
      newUsersToday: newUsersToday ?? 0,
      activeVendors: activeVendors ?? 0,
      inTransit: inTransit ?? 0,
    });

    // Revenue chart — last 7 days
    const since7d = new Date(Date.now() - 6 * 86400000);
    since7d.setHours(0, 0, 0, 0);

    const { data: weekOrders } = await db
      .from('orders')
      .select('total, created_at')
      .gte('created_at', since7d.toISOString())
      .neq('order_status', 'cancelled');

    const revenueByDay: Record<string, number> = {};
    // Initialize 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      revenueByDay[key] = 0;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (weekOrders ?? []).forEach((r: any) => {
      const key = r.created_at.slice(0, 10);
      if (key in revenueByDay) revenueByDay[key] += Number(r.total);
    });

    setChartData(
      Object.entries(revenueByDay).map(([date, revenue]) => ({
        day: DAY_LABELS_FR[new Date(date + 'T12:00:00').getDay()],
        revenue,
      }))
    );

    // Recent orders (last 5) using admin query
    try {
      const orders = await fetchAdminOrders();
      setRecentOrders(orders.slice(0, 5));
    } catch { /* empty */ }

    setIsLoading(false);
  }

  const kpiCards = stats
    ? [
        { label: 'CA du jour', value: stats.revenueToday, suffix: ' FCFA', icon: DollarSign, color: 'var(--nafa-green)', bg: 'bg-green-50' },
        { label: 'Commandes du jour', value: stats.ordersToday, suffix: '', icon: Package, color: 'var(--nafa-blue)', bg: 'bg-blue-50' },
        { label: 'Nouveaux utilisateurs', value: stats.newUsersToday, suffix: '', icon: UserPlus, color: '#8B5CF6', bg: 'bg-purple-50' },
        { label: 'Vendeurs actifs', value: stats.activeVendors, suffix: '', icon: Store, color: 'var(--nafa-orange)', bg: 'bg-orange-50' },
        { label: 'En route entrepôt', value: stats.inTransit, suffix: '', icon: Truck, color: 'var(--nafa-gray-700)', bg: 'bg-gray-50' },
      ]
    : null;

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--nafa-black)' }}>Dashboard Admin</h1>
        <p className="text-sm mt-1" suppressHydrationWarning style={{ color: 'var(--nafa-gray-700)' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI cards */}
      {isLoading || !kpiCards ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
              <Skeleton className="w-10 h-10 rounded-xl mb-3" />
              <Skeleton className="h-7 w-20 rounded mb-1" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8"
        >
          {kpiCards.map((kpi) => (
            <motion.div
              key={kpi.label}
              variants={cardVariants}
              className="bg-white rounded-2xl p-4 border"
              style={{ borderColor: 'var(--nafa-gray-200)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                  <kpi.icon size={20} strokeWidth={1.75} style={{ color: kpi.color }} />
                </div>
              </div>
              <p className="text-2xl font-black nafa-mono" style={{ color: 'var(--nafa-black)' }}>
                <AnimatedCounter
                  value={kpi.value}
                  suffix={kpi.value >= 10000 ? '' : kpi.suffix}
                />
                {kpi.value >= 10000 && (
                  <span className="text-sm font-medium ml-0.5" style={{ color: 'var(--nafa-gray-700)' }}>FCFA</span>
                )}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--nafa-gray-700)' }}>{kpi.label}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-x-hidden">
        {/* Revenue chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 border"
          style={{ borderColor: 'var(--nafa-gray-200)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--nafa-black)' }}>Revenus — 7 derniers jours</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-700)' }}>Total en FCFA</p>
            </div>
            {chartData.length > 0 && (() => {
              const total = chartData.reduce((s, d) => s + d.revenue, 0);
              return total > 0 ? (
                <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
                  <TrendingUp size={16} strokeWidth={1.75} />
                  {formatCurrency(total, 'FCFA')}
                </div>
              ) : null;
            })()}
          </div>
          {isLoading ? (
            <Skeleton className="w-full h-[220px] rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B2C" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#FF6B2C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#616161' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#616161' }}
                  tickFormatter={(v: number) => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'white', border: '1px solid #EEEEEE', borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [formatCurrency(Number(v ?? 0), 'FCFA'), 'Revenu']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#FF6B2C" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#FF6B2C' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Recent orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="bg-white rounded-2xl p-6 border"
          style={{ borderColor: 'var(--nafa-gray-200)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: 'var(--nafa-black)' }}>Commandes récentes</h2>
            <Link href="/admin/orders" className="text-xs font-medium" style={{ color: 'var(--nafa-orange)' }}>Voir tout</Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-24 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--nafa-gray-400)' }}>Aucune commande</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/admin/orders/${order.id}`}>
                  <div className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-1 -mx-1 transition-colors">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: 'var(--nafa-orange)' }}
                    >
                      {(order.clientName ?? 'C')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--nafa-black)' }}>{order.clientName ?? '—'}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--nafa-gray-700)' }}>{order.vendorName ?? '—'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold nafa-mono" style={{ color: 'var(--nafa-black)' }}>{formatCurrency(order.total, order.currency)}</p>
                      <StatusBadge status={order.orderStatus} className="text-[10px] py-0.5 px-1.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
