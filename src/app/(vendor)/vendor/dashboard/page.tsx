'use client';
import { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  TrendingUp, Package, Star, Eye, Bell, AlertTriangle,
  Users, Trophy, Plus, ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/shared/SkeletonShimmer';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { fetchVendorOrders } from '@/lib/api/orders';
import type { Order } from '@/types';

interface VendorStats {
  shopName: string;
  revenue7d: number;
  activeOrders: number;
  rating: number;
  followerCount: number;
}

interface TopVendor {
  rank: number;
  vendorId: string;
  name: string;
  sales: number;
  isMe: boolean;
}

const containerVariants: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const cardVariants: Variants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

const RANK_BADGE: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function VendorDashboardPage() {
  const [topPeriod, setTopPeriod] = useState<'jour' | 'semaine' | 'mois'>('semaine');
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topVendors, setTopVendors] = useState<TopVendor[]>([]);
  const [lowStock, setLowStock] = useState<{ name: string; stock: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Vendor profile (shop name, rating, followers)
    const { data: vp } = await db
      .from('vendor_profiles')
      .select('shop_name, rating, follower_count')
      .eq('id', user.id)
      .single();

    // Revenue last 7 days (orders not cancelled)
    const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: revenueRows } = await db
      .from('orders')
      .select('subtotal')
      .eq('vendor_id', user.id)
      .neq('order_status', 'cancelled')
      .gte('created_at', since7d);

    // vendor revenue = subtotal / 1.1 (strip NAFA 10% commission)
    const revenue7d = Math.round(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (revenueRows ?? []).reduce((sum: number, r: any) => sum + Number(r.subtotal), 0) / 1.1
    );

    // Active orders (not delivered/cancelled)
    const { count: activeOrders } = await db
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', user.id)
      .not('order_status', 'in', '("delivered","cancelled")');

    setStats({
      shopName: vp?.shop_name ?? 'Ma boutique',
      revenue7d,
      activeOrders: activeOrders ?? 0,
      rating: Number(vp?.rating ?? 0),
      followerCount: vp?.follower_count ?? 0,
    });

    // Recent orders (last 5)
    try {
      const orders = await fetchVendorOrders(user.id);
      setRecentOrders(orders.slice(0, 5));
    } catch { /* empty orders */ }

    // Top 5 vendors by total_revenue (public data from vendor_profiles)
    const { data: topRows } = await db
      .from('vendor_profiles')
      .select('id, shop_name, total_revenue, total_sales')
      .order('total_revenue', { ascending: false })
      .limit(5);

    if (topRows) {
      setTopVendors(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        topRows.map((row: any, i: number) => ({
          rank: i + 1,
          vendorId: row.id,
          name: row.shop_name,
          sales: row.total_sales,
          isMe: row.id === user.id,
        }))
      );
    }

    // Low stock products (≤ 5 units)
    const { data: stockRows } = await db
      .from('products')
      .select('title, stock')
      .eq('vendor_id', user.id)
      .eq('is_active', true)
      .lte('stock', 5)
      .order('stock', { ascending: true })
      .limit(3);

    if (stockRows) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setLowStock(stockRows.map((r: any) => ({ name: r.title, stock: r.stock })));
    }

    setIsLoading(false);
  }

  const kpiCards = stats
    ? [
        { label: 'Revenus (7 jours)', value: stats.revenue7d, suffix: ' FCFA', icon: TrendingUp, color: 'var(--nafa-green)', bg: 'bg-green-50' },
        { label: 'Commandes en cours', value: stats.activeOrders, suffix: '', icon: Package, color: 'var(--nafa-blue)', bg: 'bg-blue-50' },
        { label: 'Note moyenne', value: stats.rating, suffix: '/5', icon: Star, color: 'var(--nafa-orange)', bg: 'bg-orange-50' },
        { label: 'Followers', value: stats.followerCount, suffix: '', icon: Eye, color: '#8B5CF6', bg: 'bg-purple-50' },
      ]
    : null;

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--nafa-black)' }}>
            Bonjour,{' '}
            {isLoading ? (
              <Skeleton className="inline-block h-7 w-40 rounded align-middle" />
            ) : (
              stats?.shopName
            )}
          </h1>
          <p className="text-sm mt-1" suppressHydrationWarning style={{ color: 'var(--nafa-gray-700)' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link href="/vendor/products/new">
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02, translateY: -1 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--nafa-orange)' }}
          >
            <Plus size={16} strokeWidth={1.75} />
            Ajouter un produit
          </motion.button>
        </Link>
      </div>

      {/* KPI cards */}
      {isLoading || !kpiCards ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
              <Skeleton className="w-10 h-10 rounded-xl mb-3" />
              <Skeleton className="h-7 w-24 rounded mb-1" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpiCards.map((kpi) => (
            <motion.div key={kpi.label} variants={cardVariants} className="bg-white rounded-2xl p-4 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                  <kpi.icon size={20} strokeWidth={1.75} style={{ color: kpi.color }} />
                </div>
              </div>
              <p className="text-2xl font-black nafa-mono" style={{ color: 'var(--nafa-black)' }}>
                <AnimatedCounter
                  value={kpi.value}
                  suffix={kpi.value >= 1000 ? '' : kpi.suffix}
                  decimals={kpi.value % 1 !== 0 ? 1 : 0}
                />
                {kpi.value >= 1000 && kpi.suffix === ' FCFA' && (
                  <span className="text-sm font-medium ml-0.5" style={{ color: 'var(--nafa-gray-700)' }}>FCFA</span>
                )}
                {kpi.suffix === '/5' && (
                  <span className="text-sm font-medium" style={{ color: 'var(--nafa-gray-700)' }}>/5</span>
                )}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--nafa-gray-700)' }}>{kpi.label}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Secondary row */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Recent notifications placeholder */}
        <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-blue)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--nafa-gray-900)' }}>Alertes récentes</h3>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-2">
              {recentOrders.slice(0, 2).map((order) => (
                <div key={order.id} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <p className="text-xs" style={{ color: 'var(--nafa-gray-700)' }}>
                    Commande de {order.clientName ?? 'client'} — <StatusBadge status={order.orderStatus} className="text-[10px] py-0 px-1" />
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>Aucune alerte récente</p>
          )}
        </div>

        {/* Low stock */}
        <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-error)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--nafa-gray-900)' }}>Stock faible</h3>
          </div>
          {lowStock.length > 0 ? (
            <div className="space-y-2">
              {lowStock.map((p) => (
                <div key={p.name} className="flex items-center justify-between">
                  <p className="text-xs truncate" style={{ color: 'var(--nafa-gray-700)' }}>{p.name}</p>
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    p.stock === 0 ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {p.stock === 0 ? 'Épuisé' : `${p.stock} restants`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>Tous les stocks sont OK</p>
          )}
        </div>

        {/* Audience */}
        <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--nafa-gray-900)' }}>Votre audience</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs" style={{ color: 'var(--nafa-gray-700)' }}>Followers</p>
              {isLoading ? (
                <Skeleton className="h-4 w-10 rounded" />
              ) : (
                <AnimatedCounter value={stats?.followerCount ?? 0} className="text-sm font-bold" />
              )}
            </div>
            {topVendors.length > 0 && (() => {
              const myRank = topVendors.find((v) => v.isMe)?.rank;
              return myRank ? (
                <div className="flex items-center gap-1.5">
                  <Trophy size={13} strokeWidth={1.75} style={{ color: 'var(--nafa-warning)' }} />
                  <p className="text-xs" style={{ color: 'var(--nafa-gray-700)' }}>Rang #{myRank} sur la plateforme</p>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      </motion.div>

      {/* Recent orders */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-white rounded-2xl border mb-8" style={{ borderColor: 'var(--nafa-gray-200)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--nafa-gray-200)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--nafa-black)' }}>Commandes récentes</h2>
          <Link href="/vendor/orders" className="text-sm font-medium" style={{ color: 'var(--nafa-orange)' }}>Voir tout</Link>
        </div>
        {isLoading ? (
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3 border-b last:border-0" style={{ borderColor: 'var(--nafa-gray-100)' }}>
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-32 rounded flex-1" />
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="px-6 py-8 text-sm text-center" style={{ color: 'var(--nafa-gray-400)' }}>Aucune commande pour l&apos;instant</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--nafa-gray-200)' }}>
                  {['ID', 'Produit', 'Montant', 'Statut', 'Action'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--nafa-gray-100)' }}>
                    <td className="px-6 py-3 text-xs nafa-mono" style={{ color: 'var(--nafa-gray-700)' }}>#{order.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-3 text-xs truncate max-w-32" style={{ color: 'var(--nafa-gray-700)' }}>{order.items[0]?.title ?? '—'}</td>
                    <td className="px-6 py-3 text-sm font-bold nafa-mono" style={{ color: 'var(--nafa-black)' }}>{formatCurrency(order.total, order.currency)}</td>
                    <td className="px-6 py-3"><StatusBadge status={order.orderStatus} /></td>
                    <td className="px-6 py-3">
                      <Link href={`/vendor/orders/${order.id}`} className="text-xs font-medium" style={{ color: 'var(--nafa-orange)' }}>
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Top 5 Vendeurs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        className="bg-white rounded-2xl border"
        style={{ borderColor: 'var(--nafa-gray-200)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--nafa-gray-200)' }}>
          <div className="flex items-center gap-2">
            <Trophy size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-warning)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--nafa-black)' }}>Top 5 Vendeurs</h2>
          </div>
          <div className="flex items-center gap-1">
            {(['jour', 'semaine', 'mois'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setTopPeriod(p)}
                className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                style={
                  topPeriod === p
                    ? { background: 'var(--nafa-orange)', color: '#fff' }
                    : { background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }
                }
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className="divide-y" style={{ borderColor: 'var(--nafa-gray-100)' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3">
                <Skeleton className="w-7 h-5 rounded" />
                <Skeleton className="h-4 flex-1 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
            ))}
          </div>
        ) : topVendors.length === 0 ? (
          <p className="px-6 py-8 text-sm text-center" style={{ color: 'var(--nafa-gray-400)' }}>Aucun classement disponible</p>
        ) : (
          <div>
            {topVendors.map((vendor, i) => (
              <div
                key={vendor.vendorId}
                className="flex items-center gap-4 py-3 px-6"
                style={{
                  borderTop: i === 0 ? 'none' : '1px solid var(--nafa-gray-100)',
                  background: vendor.isMe ? 'rgba(255,107,44,0.06)' : undefined,
                }}
              >
                <div className="w-7 text-center flex-shrink-0">
                  {RANK_BADGE[vendor.rank] ? (
                    <span className="text-base">{RANK_BADGE[vendor.rank]}</span>
                  ) : (
                    <span className="text-sm font-semibold" style={{ color: 'var(--nafa-gray-400)' }}>{vendor.rank}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--nafa-black)' }}>{vendor.name}</p>
                    {vendor.isMe && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                        style={{ background: 'var(--nafa-orange)', color: '#fff' }}>
                        Vous
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }}>{vendor.sales} ventes</p>
                </div>
                <ArrowUpRight size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-300)' }} />
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
