'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserX, AlertTriangle, XCircle, AlertOctagon,
  CheckCircle2, Clock, X, Store, User, ShoppingBag,
  Phone, Trash2, AlertCircle,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { Alert } from '@/types';

interface AlertRow extends Alert {
  vendorShop?: string;
  vendorName?: string;
  vendorPhone?: string;
}

// ── Config visuel par type (style notifications) ─────────────────────────────
const ALERT_CONFIG: Record<Alert['type'], {
  icon: React.ElementType;
  label: string;
  color: string;
  iconColor: string;
  dot: string;
}> = {
  vendor_inactive:  { icon: UserX,         label: 'Vendeur inactif',           color: 'bg-orange-100', iconColor: 'text-orange-600', dot: 'bg-orange-500' },
  delivery_late:    { icon: AlertTriangle,  label: 'Livraison en retard',       color: 'bg-red-100',    iconColor: 'text-red-600',    dot: 'bg-red-500'    },
  payment_failed:   { icon: XCircle,        label: 'Paiement échoué',           color: 'bg-red-100',    iconColor: 'text-red-600',    dot: 'bg-red-500'    },
  high_cancellation:{ icon: AlertOctagon,   label: "Taux d'annulation élevé",   color: 'bg-orange-100', iconColor: 'text-orange-600', dot: 'bg-orange-500' },
};

const RESOLVED_CONFIG = { color: 'bg-green-100', iconColor: 'text-green-500', dot: 'bg-green-500' };

function cfg(alert: AlertRow) {
  const base = ALERT_CONFIG[alert.type];
  if (alert.isResolved) return { ...base, ...RESOLVED_CONFIG, icon: CheckCircle2 };
  return base;
}

// ── Modal détail ─────────────────────────────────────────────────────────────
function AlertDetailModal({ alert, onClose, onResolve, onDelete }: {
  alert: AlertRow;
  onClose: () => void;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const c = cfg(alert);
  const Icon = c.icon;
  const isCritical = alert.severity === 'critical' && !alert.isResolved;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose} />
      <motion.div
        initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
        className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white overflow-hidden"
        style={{ maxHeight: '90dvh', overflowY: 'auto' }}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--nafa-gray-200)' }} />
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${c.color}`}>
                <Icon size={20} strokeWidth={1.75} className={c.iconColor} />
              </div>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wide ${
                  isCritical ? 'text-red-600' : alert.isResolved ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {alert.isResolved ? 'Résolu' : alert.severity === 'critical' ? 'Critique' : 'Avertissement'}
                </p>
                <p className="text-base font-bold" style={{ color: 'var(--nafa-black)' }}>
                  {ALERT_CONFIG[alert.type].label}
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--nafa-gray-100)' }}>
              <X size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />
            </button>
          </div>

          <p className="text-sm mb-5" style={{ color: 'var(--nafa-gray-700)' }}>{alert.description}</p>

          <div className="space-y-3 mb-5">
            {(alert.vendorShop || alert.vendorName) && (
              <div className="p-4 rounded-2xl" style={{ background: 'var(--nafa-gray-100)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Store size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>
                    Vendeur concerné
                  </p>
                </div>
                <div className="space-y-1.5">
                  {alert.vendorShop && (
                    <div className="flex items-center gap-2">
                      <Store size={13} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                      <p className="text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>{alert.vendorShop}</p>
                    </div>
                  )}
                  {alert.vendorName && (
                    <div className="flex items-center gap-2">
                      <User size={13} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                      <p className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>{alert.vendorName}</p>
                    </div>
                  )}
                  {alert.vendorPhone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                      <p className="text-sm nafa-mono" style={{ color: 'var(--nafa-gray-700)' }}>{alert.vendorPhone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {alert.relatedOrderId && (
              <div className="p-4 rounded-2xl" style={{ background: 'var(--nafa-gray-100)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-green)' }} />
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>
                    Commande
                  </p>
                </div>
                <p className="text-sm font-semibold nafa-mono" style={{ color: 'var(--nafa-black)' }}>
                  #{String(alert.relatedOrderId).slice(0, 8).toUpperCase()}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 mb-5">
            <Clock size={12} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
            <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>
              {formatRelativeTime(alert.createdAt)}
            </span>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}>
              Fermer
            </button>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => { onDelete(alert.id); onClose(); }}
              className="py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
              style={{ background: 'rgba(255,23,68,0.08)', color: 'var(--nafa-error)' }}>
              <Trash2 size={14} strokeWidth={1.75} />
              Supprimer
            </motion.button>
            {!alert.isResolved && (
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => { onResolve(alert.id); onClose(); }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'var(--nafa-green)' }}>
                <CheckCircle2 size={15} strokeWidth={1.75} />
                Résolu
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'all' | 'resolved'>('active');
  const [selectedAlert, setSelectedAlert] = useState<AlertRow | null>(null);
  const [isDeletingResolved, setIsDeletingResolved] = useState(false);
  const now = Date.now();

  useEffect(() => { void loadAlerts(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAlerts() {
    setIsLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: rows } = await db
      .from('alerts')
      .select(`
        id, type, severity, related_order_id, related_vendor_id,
        description, is_resolved, created_at,
        vendor:profiles!alerts_related_vendor_id_fkey(
          first_name, last_name, phone,
          vendor_profiles(shop_name)
        )
      `)
      .order('created_at', { ascending: false });

    if (!rows) { setIsLoading(false); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setAlerts(rows.map((r: any) => {
      const vp = Array.isArray(r.vendor?.vendor_profiles)
        ? r.vendor.vendor_profiles[0]
        : r.vendor?.vendor_profiles;
      return {
        id: r.id,
        type: r.type as Alert['type'],
        severity: r.severity as Alert['severity'],
        relatedOrderId: r.related_order_id ?? undefined,
        relatedVendorId: r.related_vendor_id ?? undefined,
        description: r.description ?? '',
        isResolved: r.is_resolved,
        createdAt: r.created_at,
        vendorShop: vp?.shop_name,
        vendorName: r.vendor ? `${r.vendor.first_name} ${r.vendor.last_name}`.trim() : undefined,
        vendorPhone: r.vendor?.phone,
      };
    }));

    setIsLoading(false);
  }

  async function resolveAlert(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('alerts').update({ is_resolved: true }).eq('id', id);
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, isResolved: true } : a));
  }

  async function deleteAlert(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('alerts').delete().eq('id', id);
  }

  async function deleteResolvedAlerts() {
    setIsDeletingResolved(true);
    const resolvedIds = alerts.filter((a) => a.isResolved).map((a) => a.id);
    setAlerts((prev) => prev.filter((a) => !a.isResolved));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('alerts').delete().in('id', resolvedIds);
    setIsDeletingResolved(false);
  }

  const filtered = alerts.filter((a) =>
    filter === 'all' || (filter === 'active' ? !a.isResolved : a.isResolved)
  );
  const activeCount = alerts.filter((a) => !a.isResolved).length;
  const criticalCount = alerts.filter((a) => !a.isResolved && a.severity === 'critical').length;

  // Groupement par date (même logique que notifications)
  const grouped = {
    today:     filtered.filter((a) => now - new Date(a.createdAt).getTime() < 86400000),
    yesterday: filtered.filter((a) => { const d = now - new Date(a.createdAt).getTime(); return d >= 86400000 && d < 172800000; }),
    older:     filtered.filter((a) => now - new Date(a.createdAt).getTime() >= 172800000),
  };

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 w-full max-w-2xl">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--nafa-black)' }}>Alertes système</h1>
            {!isLoading && (
              <div className="flex items-center gap-3 mt-1">
                {criticalCount > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-red-600">
                      {criticalCount} critique{criticalCount > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {activeCount > criticalCount && (
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-sm font-medium" style={{ color: 'var(--nafa-orange)' }}>
                      {activeCount - criticalCount} avertissement{activeCount - criticalCount > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {activeCount === 0 && (
                  <span className="text-sm text-green-600 font-medium">Aucune alerte active</span>
                )}
              </div>
            )}
          </div>
          {alerts.some((a) => a.isResolved) && (
            <button
              onClick={() => void deleteResolvedAlerts()}
              disabled={isDeletingResolved}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,23,68,0.07)', color: 'var(--nafa-error)' }}>
              {isDeletingResolved
                ? <div className="w-3 h-3 rounded-full border border-red-300 border-t-red-600 animate-spin" />
                : <Trash2 size={11} strokeWidth={2} />}
              Supprimer les résolues
            </button>
          )}
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2 mb-6">
          {(['active', 'all', 'resolved'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={{
                background: filter === f ? 'var(--nafa-black)' : 'white',
                color: filter === f ? 'white' : 'var(--nafa-gray-700)',
                border: `1px solid ${filter === f ? 'var(--nafa-black)' : 'var(--nafa-gray-200)'}`,
              }}>
              {f === 'active' ? 'Actives' : f === 'all' ? 'Toutes' : 'Résolues'}
            </button>
          ))}
        </div>

        {/* Contenu */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-white border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
                <div className="w-10 h-10 rounded-2xl animate-pulse flex-shrink-0" style={{ background: 'var(--nafa-gray-100)' }} />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-28 rounded animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
                  <div className="h-3 w-full rounded animate-pulse" style={{ background: 'var(--nafa-gray-100)' }} />
                  <div className="h-2.5 w-16 rounded animate-pulse" style={{ background: 'var(--nafa-gray-100)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }}>
              <AlertCircle size={24} strokeWidth={1.5} style={{ color: 'var(--nafa-gray-400)' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--nafa-gray-400)' }}>Aucune alerte</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([key, list]) => {
              if (!list.length) return null;
              const label = key === 'today' ? "Aujourd'hui" : key === 'yesterday' ? 'Hier' : 'Plus tôt';
              return (
                <div key={key}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--nafa-gray-400)' }}>{label}</p>
                  <div className="space-y-2">
                    {list.map((alert, i) => {
                      const c = cfg(alert);
                      const Icon = c.icon;
                      const unread = !alert.isResolved;
                      return (
                        <motion.div key={alert.id}
                          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => setSelectedAlert(alert)}
                          className="flex items-start gap-3 p-3 rounded-2xl cursor-pointer"
                          style={{
                            border: `1px solid ${unread ? (alert.severity === 'critical' ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.12)') : 'var(--nafa-gray-200)'}`,
                            background: unread ? (alert.severity === 'critical' ? 'rgba(239,68,68,0.03)' : 'rgba(249,115,22,0.03)') : 'var(--nafa-white)',
                          }}>
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${c.color}`}>
                            <Icon size={18} strokeWidth={1.75} className={c.iconColor} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold" style={{ color: 'var(--nafa-black)' }}>
                                {ALERT_CONFIG[alert.type].label}
                              </p>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {unread && <span className={`w-2 h-2 rounded-full ${c.dot}`} />}
                                <button
                                  onClick={(e) => { e.stopPropagation(); void deleteAlert(alert.id); }}
                                  className="w-6 h-6 rounded-full flex items-center justify-center"
                                  style={{ background: 'var(--nafa-gray-100)' }}
                                  aria-label="Supprimer">
                                  <Trash2 size={11} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--nafa-gray-700)' }}>
                              {alert.description}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--nafa-gray-400)' }}>
                              {formatRelativeTime(alert.createdAt)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedAlert && (
          <AlertDetailModal
            alert={selectedAlert}
            onClose={() => setSelectedAlert(null)}
            onResolve={resolveAlert}
            onDelete={deleteAlert}
          />
        )}
      </AnimatePresence>
    </>
  );
}
