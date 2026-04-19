'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserX, AlertTriangle, XCircle, AlertOctagon,
  CheckCircle2, Clock, X, Store, User, ShoppingBag,
  Phone, Trash2,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { Alert } from '@/types';

interface AlertRow extends Alert {
  vendorShop?: string;
  vendorName?: string;
  vendorPhone?: string;
  orderAmount?: number;
}

const ALERT_META: Record<Alert['type'], { icon: React.ElementType; label: string }> = {
  vendor_inactive: { icon: UserX, label: 'Vendeur inactif' },
  delivery_late: { icon: AlertTriangle, label: 'Livraison en retard' },
  payment_failed: { icon: XCircle, label: 'Paiement échoué' },
  high_cancellation: { icon: AlertOctagon, label: "Taux d'annulation élevé" },
};

function AlertDetailModal({ alert, onClose, onResolve, onDelete }: {
  alert: AlertRow;
  onClose: () => void;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = ALERT_META[alert.type];
  const Icon = meta.icon;
  const isCritical = alert.severity === 'critical' && !alert.isResolved;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose} />
      <motion.div
        initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white overflow-hidden"
        style={{ maxHeight: '90dvh', overflowY: 'auto' }}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--nafa-gray-200)' }} />
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                alert.isResolved ? 'bg-gray-100' : isCritical ? 'bg-red-50' : 'bg-orange-50'
              }`}>
                {alert.isResolved
                  ? <CheckCircle2 size={20} strokeWidth={1.75} className="text-green-500" />
                  : <Icon size={20} strokeWidth={1.75} className={isCritical ? 'text-red-500' : 'text-orange-500'} />}
              </div>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wide ${
                  isCritical ? 'text-red-600' : alert.isResolved ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {alert.isResolved ? 'Résolu' : alert.severity === 'critical' ? 'Critique' : 'Avertissement'}
                </p>
                <p className="text-base font-bold" style={{ color: 'var(--nafa-black)' }}>{meta.label}</p>
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
                <div className="flex items-center gap-2 mb-3">
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

          <div className="flex items-center gap-2 mb-5">
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

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'all' | 'resolved'>('active');
  const [selectedAlert, setSelectedAlert] = useState<AlertRow | null>(null);
  const [isDeletingResolved, setIsDeletingResolved] = useState(false);

  useEffect(() => { loadAlerts(); }, []); // eslint-disable-line react-hooks/immutability

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

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--nafa-black)' }}>Alertes système</h1>
          <div className="flex items-center gap-4 mt-2">
            {isLoading ? (
              <div className="h-4 w-32 rounded animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
            ) : (
              <>
                {criticalCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-red-600">
                      {criticalCount} critique{criticalCount > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {activeCount > criticalCount && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-sm font-medium" style={{ color: 'var(--nafa-orange)' }}>
                      {activeCount - criticalCount} avertissement{activeCount - criticalCount > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {activeCount === 0 && (
                  <span className="text-sm text-green-600 font-medium">Aucune alerte active</span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          {(['active', 'all', 'resolved'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: filter === f ? 'var(--nafa-black)' : 'white',
                color: filter === f ? 'white' : 'var(--nafa-gray-700)',
                border: `1px solid ${filter === f ? 'var(--nafa-black)' : 'var(--nafa-gray-200)'}`,
              }}>
              {f === 'active' ? 'Actives' : f === 'all' ? 'Toutes' : 'Résolues'}
            </button>
          ))}
          {alerts.some((a) => a.isResolved) && (
            <button
              onClick={() => void deleteResolvedAlerts()}
              disabled={isDeletingResolved}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ background: 'rgba(255,23,68,0.07)', color: 'var(--nafa-error)', border: '1px solid rgba(255,23,68,0.15)' }}>
              {isDeletingResolved
                ? <div className="w-3 h-3 rounded-full border border-red-300 border-t-red-600 animate-spin" />
                : <Trash2 size={13} strokeWidth={1.75} />}
              Supprimer les résolues
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: 'var(--nafa-gray-100)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
                    <div className="h-4 w-full rounded animate-pulse" style={{ background: 'var(--nafa-gray-100)' }} />
                    <div className="h-3 w-20 rounded animate-pulse" style={{ background: 'var(--nafa-gray-100)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filtered.map((alert, i) => {
                const meta = ALERT_META[alert.type];
                const Icon = meta.icon;
                return (
                  <motion.div key={alert.id} layout
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.06 }}
                    className="bg-white rounded-2xl p-5 border-l-4 cursor-pointer hover:shadow-md transition-shadow"
                    style={{
                      borderColor: alert.isResolved ? 'var(--nafa-gray-200)' : alert.severity === 'critical' ? '#EF4444' : '#F97316',
                      borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1,
                      borderTopColor: 'var(--nafa-gray-200)', borderRightColor: 'var(--nafa-gray-200)', borderBottomColor: 'var(--nafa-gray-200)',
                    }}
                    onClick={() => setSelectedAlert(alert)}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        alert.isResolved ? 'bg-gray-100' : alert.severity === 'critical' ? 'bg-red-50' : 'bg-orange-50'
                      }`}>
                        {alert.isResolved
                          ? <CheckCircle2 size={20} strokeWidth={1.75} className="text-green-500" />
                          : <Icon size={20} strokeWidth={1.75} className={alert.severity === 'critical' ? 'text-red-500' : 'text-orange-500'} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold uppercase tracking-wide ${
                            alert.severity === 'critical' && !alert.isResolved ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            {alert.isResolved ? 'Résolu' : alert.severity === 'critical' ? 'Critique' : 'Avertissement'}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>{alert.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock size={12} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                          <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>
                            {formatRelativeTime(alert.createdAt)}
                          </span>
                          <span className="text-xs ml-1" style={{ color: 'var(--nafa-orange)' }}>· Voir le détail →</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!alert.isResolved && (
                          <motion.button whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); resolveAlert(alert.id); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                            style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}>
                            <CheckCircle2 size={13} strokeWidth={1.75} />Résoudre
                          </motion.button>
                        )}
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={(e) => { e.stopPropagation(); void deleteAlert(alert.id); }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: 'rgba(255,23,68,0.07)' }}
                          aria-label="Supprimer">
                          <Trash2 size={13} strokeWidth={1.75} style={{ color: 'var(--nafa-error)' }} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <CheckCircle2 size={36} strokeWidth={1.5} className="mx-auto mb-3 text-green-500" />
                <p className="text-sm font-medium" style={{ color: 'var(--nafa-gray-700)' }}>Aucune alerte</p>
              </div>
            )}
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
