'use client';
import { use, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, User, MapPin, Phone, CreditCard, Smartphone,
  ChevronRight, AlertTriangle, CheckCircle2, XCircle, Store, Hash,
  Printer, X as XIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { OrderStatusStepper } from '@/components/shared/OrderStatusStepper';
import { formatCurrency, formatOrderId } from '@/lib/utils';
import {
  useAdminOrdersStore,
  ADMIN_TRANSITIONS,
  ADMIN_TRANSITION_LABELS,
} from '@/stores/adminOrdersStore';
import type { Order } from '@/types';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  orange_money: 'Orange Money',
  moov_money: 'Moov Money',
  card: 'Carte bancaire',
};

function PaymentMethodIcon({ method }: { method: string }) {
  if (method === 'card') return <CreditCard size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />;
  return <Smartphone size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />;
}

const sectionVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.32 } } };

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getOrder, advanceStatus, cancelOrder, fetchOrders, orders } = useAdminOrdersStore();
  const order = getOrder(id);

  const [confirmAction, setConfirmAction] = useState<'advance' | 'cancel' | null>(null);
  const [justUpdated, setJustUpdated] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    // Always fetch on mount to ensure fresh data
    void fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ordre non trouvé
  if (!order) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>Commande introuvable.</p>
        <Link href="/admin/orders" className="text-sm font-medium mt-4 inline-block" style={{ color: 'var(--nafa-orange)' }}>
          Retour aux commandes
        </Link>
      </div>
    );
  }

  const commission = Math.round(order.subtotal * 0.1);
  const nextStatus = ADMIN_TRANSITIONS[order.orderStatus];
  const nextLabel = ADMIN_TRANSITION_LABELS[order.orderStatus];
  const canCancel = order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled';
  const isTerminal = order.orderStatus === 'delivered' || order.orderStatus === 'cancelled';

  const runWithTimeout = (promise: Promise<void>, ms = 12000): Promise<void> =>
    Promise.race([
      promise,
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Délai dépassé — veuillez réessayer.')), ms)
      ),
    ]);

  const handleAdvance = async () => {
    setConfirmAction(null);
    setIsUpdating(true);
    setUpdateError(null);
    try {
      await runWithTimeout(advanceStatus(order.id));
      // Re-fetch from DB to confirm the update persisted (not just optimistic)
      await fetchOrders();
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 3000);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    setConfirmAction(null);
    setIsUpdating(true);
    setUpdateError(null);
    try {
      await runWithTimeout(cancelOrder(order.id));
      await fetchOrders();
      setJustUpdated(true);
      setTimeout(() => {
        setJustUpdated(false);
        router.push('/admin/orders');
      }, 1500);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Erreur lors de l\'annulation.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Back + header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
        <Link href="/admin/orders">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center border"
            style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-white)' }} aria-label="Retour">
            <ArrowLeft size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold nafa-mono tracking-tight" style={{ color: 'var(--nafa-black)' }}>
            {formatOrderId(order.id)}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }} suppressHydrationWarning>
            {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <StatusBadge status={order.orderStatus} />
          <button
            onClick={() => setShowLabel(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border"
            style={{ borderColor: 'var(--nafa-gray-200)', color: 'var(--nafa-gray-700)', background: 'var(--nafa-white)' }}
            aria-label="Imprimer l'étiquette"
          >
            <Printer size={15} strokeWidth={1.75} />
            <span className="hidden sm:inline">Étiquette</span>
          </button>
        </div>
      </motion.div>

      {/* Error toast */}
      <AnimatePresence>
        {updateError && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--nafa-error)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertTriangle size={16} strokeWidth={1.75} />
            {updateError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast confirmation */}
      <AnimatePresence>
        {justUpdated && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(0,200,83,0.1)', color: 'var(--nafa-green)', border: '1px solid rgba(0,200,83,0.2)' }}
          >
            <CheckCircle2 size={16} strokeWidth={1.75} />
            Statut mis à jour avec succès
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin action panel */}
      {!isTerminal && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-5 rounded-2xl border"
          style={{ background: 'var(--nafa-white)', borderColor: 'var(--nafa-gray-200)' }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--nafa-black)' }}>
            Actions admin
          </h2>
          <div className="flex flex-wrap gap-3">
            {nextStatus && nextLabel && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={isUpdating}
                onClick={() => setConfirmAction('advance')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'var(--nafa-orange)' }}
              >
                {isUpdating
                  ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  : <ChevronRight size={15} strokeWidth={1.75} />
                }
                {nextLabel}
              </motion.button>
            )}
            {canCancel && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={isUpdating}
                onClick={() => setConfirmAction('cancel')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border disabled:opacity-60"
                style={{ borderColor: 'var(--nafa-error)', color: 'var(--nafa-error)', background: 'rgba(255,23,68,0.05)' }}
              >
                <XCircle size={15} strokeWidth={1.75} />
                Annuler la commande
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setConfirmAction(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: confirmAction === 'cancel' ? 'rgba(255,23,68,0.1)' : 'rgba(255,107,44,0.1)' }}>
                  {confirmAction === 'cancel'
                    ? <AlertTriangle size={20} strokeWidth={1.75} style={{ color: 'var(--nafa-error)' }} />
                    : <ChevronRight size={20} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                  }
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>
                    {confirmAction === 'cancel' ? 'Annuler la commande ?' : 'Confirmer l\'action ?'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-700)' }}>
                    {confirmAction === 'cancel'
                      ? 'Cette action est irréversible.'
                      : `Passage vers : ${nextLabel}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                  style={{ borderColor: 'var(--nafa-gray-200)', color: 'var(--nafa-gray-700)' }}
                >
                  Annuler
                </button>
                <button
                  onClick={confirmAction === 'cancel' ? handleCancel : handleAdvance}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: confirmAction === 'cancel' ? 'var(--nafa-error)' : 'var(--nafa-orange)' }}
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={sectionVariants} initial="hidden" animate="visible"
        className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start space-y-6 lg:space-y-0">

        {/* Left: items + summary */}
        <div className="space-y-6">
          <motion.div variants={itemVariants} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--nafa-gray-200)' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--nafa-gray-200)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--nafa-black)' }}>
                Articles ({order.items.reduce((acc, it) => acc + it.quantity, 0)})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'var(--nafa-gray-100)' }}>
                    {['Produit', 'Qté', 'Prix unitaire', 'Sous-total'].map((h) => (
                      <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={item.productId} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--nafa-gray-100)' }}>
                      <td className="px-5 py-3.5 text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>{item.title}</td>
                      <td className="px-5 py-3.5 text-sm nafa-mono" style={{ color: 'var(--nafa-gray-700)' }}>{item.quantity}</td>
                      <td className="px-5 py-3.5 text-sm nafa-mono" style={{ color: 'var(--nafa-gray-700)' }}>{formatCurrency(item.price, order.currency)}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold nafa-mono" style={{ color: 'var(--nafa-black)' }}>{formatCurrency(item.price * item.quantity, order.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--nafa-gray-200)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--nafa-black)' }}>Récapitulatif</h2>
            <div className="space-y-3">
              {[
                { label: 'Sous-total', value: formatCurrency(order.subtotal, order.currency), color: 'var(--nafa-black)' },
                { label: 'Frais de livraison', value: order.deliveryFee === 0 ? 'Offerts' : formatCurrency(order.deliveryFee, order.currency), color: 'var(--nafa-black)' },
                { label: 'Commission NAFA (10%)', value: `-${formatCurrency(commission, order.currency)}`, color: 'var(--nafa-orange)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: color === 'var(--nafa-black)' ? 'var(--nafa-gray-700)' : color }}>{label}</span>
                  <span className="text-sm font-medium nafa-mono" style={{ color }}>{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid var(--nafa-gray-200)' }}>
                <span className="text-base font-bold" style={{ color: 'var(--nafa-black)' }}>Total</span>
                <span className="text-base font-black nafa-mono" style={{ color: 'var(--nafa-black)' }}>{formatCurrency(order.total, order.currency)}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: stepper + client + payment */}
        <div className="space-y-6">
          <motion.div variants={itemVariants} className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--nafa-gray-200)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--nafa-black)' }}>Suivi de la commande</h2>
            <OrderStatusStepper currentStatus={order.orderStatus} statusHistory={order.statusHistory} />
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--nafa-gray-200)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--nafa-black)' }}>Informations client</h2>
            <div className="space-y-3">
              {[
                { icon: User, label: 'Nom', value: order.clientName ?? '—' },
                { icon: MapPin, label: 'Adresse', value: `${order.deliveryAddress.city}, ${order.deliveryAddress.country}`, sub: order.deliveryAddress.street || undefined },
                { icon: Phone, label: 'Téléphone', value: order.clientPhone ?? '—', mono: true },
              ].map(({ icon: Icon, label, value, sub, mono }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--nafa-gray-100)' }}>
                    <Icon size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>{label}</p>
                    <p className={`text-sm font-medium${mono ? ' nafa-mono' : ''}`} style={{ color: 'var(--nafa-black)' }}>{value}</p>
                    {sub && <p className="text-xs" style={{ color: 'var(--nafa-gray-700)' }}>{sub}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--nafa-gray-200)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--nafa-black)' }}>Informations vendeur</h2>
            <div className="space-y-3">
              {[
                { icon: Store, label: 'Boutique', value: order.vendorName ?? '—' },
                { icon: Phone, label: 'Téléphone', value: order.vendorPhone ?? '—', mono: true },
                { icon: Hash, label: 'ID vendeur', value: order.vendorId, mono: true },
              ].map(({ icon: Icon, label, value, mono }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--nafa-gray-100)' }}>
                    <Icon size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>{label}</p>
                    <p className={`text-sm font-medium${mono ? ' nafa-mono' : ''}`} style={{ color: 'var(--nafa-black)' }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--nafa-gray-200)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--nafa-black)' }}>Mode de paiement</h2>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--nafa-gray-100)' }}>
                <PaymentMethodIcon method={order.paymentMethod} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                </p>
                <span className={`text-xs font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : order.paymentStatus === 'failed' ? 'text-red-500' : 'text-yellow-600'}`}>
                  {order.paymentStatus === 'paid' ? 'Payé' : order.paymentStatus === 'failed' ? 'Échoué' : 'En attente'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Shipping label modal */}
      {showLabel && (
        <ShippingLabelModal order={order} onClose={() => setShowLabel(false)} />
      )}
    </div>
  );
}

// ── Shipping label ─────────────────────────────────────────────────────────

function ShippingLabelModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const printRef  = useRef<HTMLDivElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const [scale, setScale]       = useState(1);
  const [scaledH, setScaledH]   = useState<number | null>(null);

  // Mesure après rendu → scale pour tenir dans le modal
  useEffect(() => {
    requestAnimationFrame(() => {
      const wrap  = wrapRef.current;
      const label = printRef.current;
      if (!wrap || !label) return;
      const LABEL_W = 210 * (96 / 25.4); // A4 ≈ 794px @96dpi
      const available = wrap.clientWidth - 48;
      const s = Math.min(1, available / LABEL_W);
      if (s < 1) {
        setScale(s);
        setScaledH(label.getBoundingClientRect().height * s);
      }
    });
  }, []);

  // Impression via iframe caché — reste sur la même page après le dialog
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;border:0';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) { document.body.removeChild(iframe); return; }
    doc.open();
    doc.write(`<!DOCTYPE html><html lang="fr"><head>
      <meta charset="utf-8"/>
      <title>Étiquette ${formatOrderId(order.id)}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        @page{size:A4 portrait;margin:0}
        html{width:210mm;height:297mm;overflow:hidden}
        body{width:210mm;height:297mm;overflow:hidden;font-family:Arial,sans-serif;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        .nafa-pw{width:210mm;height:297mm;overflow:hidden;display:block}
      </style>
    </head><body>${content.innerHTML}</body></html>`);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 2000);
    }, 350);
  };

  const addr = order.deliveryAddress;
  const printDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const orderDate = new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const totalQty = order.items.reduce((s, it) => s + it.quantity, 0);

  const sty = {
    // A4 exact — padding 12mm → zone utile 186×273mm — flex column pour remplir la feuille
    label: {
      width: '210mm', height: '297mm', padding: '12mm',
      fontFamily: 'Arial, sans-serif', color: '#111', fontSize: '10pt',
      overflow: 'hidden', boxSizing: 'border-box' as const,
      display: 'flex', flexDirection: 'column' as const, gap: '0',
    } as React.CSSProperties,
    section: { fontSize: '7.5pt', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#bbb', marginBottom: '2.5mm' },
    mono: { fontFamily: '"Courier New", monospace' } as React.CSSProperties,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[94vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0" style={{ borderColor: 'var(--nafa-gray-200)' }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>Étiquette d&apos;expédition</h2>
            <p className="text-xs nafa-mono mt-0.5" style={{ color: 'var(--nafa-orange)' }}>{formatOrderId(order.id)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--nafa-orange)' }}>
              <Printer size={15} strokeWidth={1.75} />Imprimer
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }}>
              <XIcon size={16} strokeWidth={2} style={{ color: 'var(--nafa-gray-700)' }} />
            </button>
          </div>
        </div>

        {/* Preview — scale to fit container */}
        <div ref={wrapRef} className="flex-1 overflow-y-auto p-4 flex justify-center">
          <div style={{ overflow: 'hidden', ...(scale < 1 && scaledH ? { height: scaledH } : {}) }}>
            <div style={scale < 1 ? { transform: `scale(${scale})`, transformOrigin: 'top left' } : {}}>
              <div ref={printRef} className="nafa-pw">
                <div style={sty.label}>

                  {/* ── En-tête ── */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6mm', borderBottom: '3px solid #111', marginBottom: '6mm', flexShrink: 0 }}>
                    <div>
                      <div style={{ fontSize: '38pt', fontWeight: 900, letterSpacing: '0.04em', lineHeight: 1 }}>
                        <span style={{ color: '#FF6B2C' }}>N</span><span>A</span>
                        <span style={{ color: '#FF6B2C' }}>F</span><span>A</span>
                      </div>
                      <div style={{ fontSize: '8pt', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '1mm' }}>Marketplace Africaine</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ ...sty.mono, fontSize: '15pt', fontWeight: 700, color: '#FF6B2C' }}>{formatOrderId(order.id)}</div>
                      <div style={{ fontSize: '8.5pt', color: '#777', marginTop: '1.5mm' }}>Commande du {orderDate}</div>
                      <div style={{ fontSize: '8.5pt', color: '#777' }}>Imprimé le {printDate}</div>
                    </div>
                  </div>

                  {/* ── Code de suivi ── */}
                  <div style={{ textAlign: 'center', padding: '7mm 4mm', background: '#f7f7f7', border: '1px solid #e0e0e0', borderRadius: '3mm', marginBottom: '6mm', flexShrink: 0 }}>
                    <div style={{ ...sty.mono, fontSize: '24pt', fontWeight: 900, letterSpacing: '0.4em', color: '#111', wordBreak: 'break-all' }}>
                      {order.id.replace(/-/g, '').toUpperCase().slice(0, 16)}
                    </div>
                    <div style={{ fontSize: '8pt', color: '#aaa', marginTop: '2mm', letterSpacing: '0.05em' }}>Code de suivi — Tracking code</div>
                  </div>

                  {/* ── Destinataire + Expéditeur ── */}
                  <div style={{ display: 'flex', gap: '0', marginBottom: '6mm', border: '1px solid #e0e0e0', borderRadius: '3mm', overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ flex: 3, padding: '6mm' }}>
                      <div style={sty.section}>▼ Destinataire</div>
                      <div style={{ fontSize: '20pt', fontWeight: 800, lineHeight: 1.1, marginBottom: '2mm' }}>{order.clientName ?? '—'}</div>
                      {order.clientPhone && <div style={{ ...sty.mono, fontSize: '14pt', fontWeight: 700, color: '#FF6B2C', marginBottom: '2.5mm' }}>{order.clientPhone}</div>}
                      <div style={{ fontSize: '11pt', color: '#333', lineHeight: 1.6 }}>
                        {addr.street && <div>{addr.street}</div>}
                        <div>{addr.city}{addr.region ? `, ${addr.region}` : ''}</div>
                        <div style={{ fontWeight: 800, fontSize: '12pt' }}>{addr.country}</div>
                      </div>
                    </div>
                    <div style={{ flex: 1.5, padding: '6mm', background: '#f9f9f9', borderLeft: '1px solid #e0e0e0' }}>
                      <div style={sty.section}>Expéditeur</div>
                      <div style={{ fontSize: '11pt', fontWeight: 800 }}>Entrepôt NAFA</div>
                      <div style={{ fontSize: '10pt', color: '#555', marginTop: '2mm', lineHeight: 1.6 }}>
                        <div>Ouagadougou</div>
                        <div>Burkina Faso</div>
                        <div style={{ color: '#FF6B2C', fontWeight: 700, marginTop: '2mm' }}>nafa.bf</div>
                      </div>
                    </div>
                  </div>

                  {/* ── Boutique vendeur ── */}
                  <div style={{ marginBottom: '6mm', padding: '5mm 6mm', background: '#fff8f5', border: '1px solid #ffe0d0', borderRadius: '3mm', flexShrink: 0 }}>
                    <div style={sty.section}>Boutique vendeur</div>
                    <div style={{ fontSize: '13pt', fontWeight: 700 }}>{order.vendorName ?? '—'}</div>
                    {order.vendorPhone && <div style={{ ...sty.mono, fontSize: '10pt', color: '#777', marginTop: '1mm' }}>{order.vendorPhone}</div>}
                  </div>

                  {/* ── Articles (flex:1 pour remplir l'espace restant) ── */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '6mm' }}>
                    <div style={sty.section}>Contenu — {totalQty} article{totalQty > 1 ? 's' : ''}</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5pt', flex: 1 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #111' }}>
                          <th style={{ textAlign: 'left', fontWeight: 700, paddingBottom: '2mm', fontSize: '10pt' }}>Produit</th>
                          <th style={{ textAlign: 'center', fontWeight: 700, paddingBottom: '2mm', width: '12mm', fontSize: '10pt' }}>Qté</th>
                          <th style={{ textAlign: 'right', fontWeight: 700, paddingBottom: '2mm', fontSize: '10pt' }}>Prix</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={item.productId} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '2.5mm 0', fontSize: '10.5pt' }}>{item.title}</td>
                            <td style={{ textAlign: 'center', padding: '2.5mm 0' }}>{item.quantity}</td>
                            <td style={{ ...sty.mono, textAlign: 'right', padding: '2.5mm 0' }}>{formatCurrency(item.price * item.quantity, order.currency)}</td>
                          </tr>
                        ))}
                        {order.deliveryFee > 0 && (
                          <tr style={{ borderBottom: '1px solid #eee' }}>
                            <td colSpan={2} style={{ padding: '2.5mm 0', color: '#777' }}>Frais de livraison</td>
                            <td style={{ ...sty.mono, textAlign: 'right', padding: '2.5mm 0' }}>{formatCurrency(order.deliveryFee, order.currency)}</td>
                          </tr>
                        )}
                        <tr style={{ borderTop: '2.5px solid #111', background: '#f7f7f7' }}>
                          <td colSpan={2} style={{ paddingTop: '3mm', paddingBottom: '3mm', paddingLeft: '2mm', fontWeight: 800, fontSize: '13pt' }}>TOTAL PAYÉ</td>
                          <td style={{ ...sty.mono, textAlign: 'right', paddingTop: '3mm', paddingBottom: '3mm', paddingRight: '2mm', fontWeight: 800, fontSize: '13pt', color: '#FF6B2C' }}>{formatCurrency(order.total, order.currency)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* ── Footer ── */}
                  <div style={{ paddingTop: '5mm', borderTop: '2px dashed #ccc', flexShrink: 0 }}>
                    <div style={{ fontSize: '9pt', fontWeight: 700, marginBottom: '2mm' }}>↩ Politique de retour — Return policy</div>
                    <div style={{ fontSize: '8.5pt', color: '#777', lineHeight: 1.7 }}>
                      En cas de problème avec votre commande, conservez ce bon et contactez NAFA dans les 7 jours suivant la réception.
                      Présentez ce document et le produit à retourner dans son emballage d&apos;origine.
                    </div>
                    <div style={{ marginTop: '3mm', fontSize: '8pt', color: '#ccc' }}>
                      Réf : {order.id} — nafa.bf
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
