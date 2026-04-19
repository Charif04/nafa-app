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
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=820,height=750');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="fr"><head>
      <meta charset="utf-8"/>
      <title>Étiquette ${formatOrderId(order.id)}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;background:#fff;color:#111}
        .label{width:148mm;min-height:210mm;padding:8mm;border:2px solid #111;margin:4mm auto}
        @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      </style>
    </head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const addr = order.deliveryAddress;
  const printDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const orderDate = new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const totalQty = order.items.reduce((s, it) => s + it.quantity, 0);

  const sty = {
    label: { width: '148mm', minHeight: '210mm', padding: '8mm', border: '2px solid #111', margin: '0 auto', fontFamily: 'Arial, sans-serif', color: '#111', fontSize: '9pt' } as React.CSSProperties,
    sectionLabel: { fontSize: '6.5pt', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#888', marginBottom: '2mm', paddingBottom: '1mm', borderBottom: '1px solid #eee' },
    mono: { fontFamily: '"Courier New", monospace' } as React.CSSProperties,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Modal header */}
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

        {/* Label preview */}
        <div className="flex-1 overflow-auto p-5">
          <div style={{ minWidth: 'min-content' }}>
          <div ref={printRef}>
            <div style={sty.label}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '5mm', borderBottom: '2px solid #111', marginBottom: '5mm' }}>
                <div>
                  <div style={{ fontSize: '24pt', fontWeight: 900, letterSpacing: '0.05em' }}>
                    <span style={{ color: '#FF6B2C' }}>N</span><span style={{ color: '#111' }}>A</span>
                    <span style={{ color: '#FF6B2C' }}>F</span><span style={{ color: '#111' }}>A</span>
                  </div>
                  <div style={{ fontSize: '6.5pt', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Marketplace Africaine</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ ...sty.mono, fontSize: '13pt', fontWeight: 700, color: '#FF6B2C' }}>{formatOrderId(order.id)}</div>
                  <div style={{ fontSize: '7pt', color: '#555', marginTop: '1mm' }}>Commande du {orderDate}</div>
                  <div style={{ fontSize: '7pt', color: '#555' }}>Imprimé le {printDate}</div>
                </div>
              </div>

              {/* Tracking barcode-like */}
              <div style={{ textAlign: 'center', margin: '0 0 5mm', padding: '3mm', border: '1px solid #ddd', borderRadius: '2mm', background: '#fafafa' }}>
                <div style={{ ...sty.mono, fontSize: '18pt', fontWeight: 700, letterSpacing: '0.3em', color: '#111' }}>
                  {order.id.replace(/-/g, '').toUpperCase().slice(0, 16)}
                </div>
                <div style={{ fontSize: '6.5pt', color: '#888', marginTop: '1mm' }}>Code de suivi — Tracking code</div>
              </div>

              {/* Destinataire + Expéditeur */}
              <div style={{ display: 'flex', gap: '5mm', marginBottom: '5mm' }}>
                <div style={{ flex: 2 }}>
                  <div style={sty.sectionLabel}>▼ DESTINATAIRE</div>
                  <div style={{ fontSize: '14pt', fontWeight: 700 }}>{order.clientName ?? '—'}</div>
                  {order.clientPhone && <div style={{ ...sty.mono, fontSize: '11pt', fontWeight: 600, color: '#FF6B2C', marginTop: '1mm' }}>{order.clientPhone}</div>}
                  <div style={{ fontSize: '9pt', marginTop: '2mm', color: '#333', lineHeight: 1.5 }}>
                    {addr.street && <div>{addr.street}</div>}
                    <div>{addr.city}{addr.region ? `, ${addr.region}` : ''}</div>
                    <div style={{ fontWeight: 700 }}>{addr.country}</div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={sty.sectionLabel}>EXPÉDITEUR</div>
                  <div style={{ fontSize: '9pt', fontWeight: 700 }}>Entrepôt NAFA</div>
                  <div style={{ fontSize: '8pt', color: '#555', marginTop: '1mm', lineHeight: 1.5 }}>
                    <div>Ouagadougou</div><div>Burkina Faso</div>
                    <div style={{ color: '#FF6B2C', fontWeight: 600, marginTop: '1mm' }}>nafa.bf</div>
                  </div>
                </div>
              </div>

              {/* Boutique */}
              <div style={{ marginBottom: '5mm' }}>
                <div style={sty.sectionLabel}>BOUTIQUE VENDEUR</div>
                <div style={{ fontSize: '9.5pt', fontWeight: 600 }}>{order.vendorName ?? '—'}</div>
                {order.vendorPhone && (
                  <div style={{ ...sty.mono, fontSize: '8.5pt', color: '#555', marginTop: '1mm' }}>{order.vendorPhone}</div>
                )}
              </div>

              {/* Articles */}
              <div style={{ marginBottom: '5mm' }}>
                <div style={sty.sectionLabel}>CONTENU — {totalQty} article{totalQty > 1 ? 's' : ''}</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                      <th style={{ textAlign: 'left', fontWeight: 700, paddingBottom: '1.5mm' }}>Produit</th>
                      <th style={{ textAlign: 'center', fontWeight: 700, paddingBottom: '1.5mm', width: '8mm' }}>Qté</th>
                      <th style={{ textAlign: 'right', fontWeight: 700, paddingBottom: '1.5mm' }}>Prix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.productId} style={{ borderBottom: '1px dotted #eee' }}>
                        <td style={{ padding: '1.5mm 0' }}>{item.title}</td>
                        <td style={{ textAlign: 'center', padding: '1.5mm 0' }}>{item.quantity}</td>
                        <td style={{ ...sty.mono, textAlign: 'right', padding: '1.5mm 0' }}>{formatCurrency(item.price * item.quantity, order.currency)}</td>
                      </tr>
                    ))}
                    {order.deliveryFee > 0 && (
                      <tr style={{ borderBottom: '1px dotted #eee' }}>
                        <td colSpan={2} style={{ padding: '1.5mm 0', color: '#555' }}>Livraison</td>
                        <td style={{ ...sty.mono, textAlign: 'right', padding: '1.5mm 0' }}>{formatCurrency(order.deliveryFee, order.currency)}</td>
                      </tr>
                    )}
                    <tr style={{ borderTop: '2px solid #111' }}>
                      <td colSpan={2} style={{ paddingTop: '2mm', fontWeight: 700, fontSize: '10pt' }}>TOTAL PAYÉ</td>
                      <td style={{ ...sty.mono, textAlign: 'right', paddingTop: '2mm', fontWeight: 700, fontSize: '10pt' }}>{formatCurrency(order.total, order.currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div style={{ paddingTop: '4mm', borderTop: '2px dashed #bbb' }}>
                <div style={{ fontSize: '8pt', fontWeight: 700, marginBottom: '1.5mm' }}>↩ POLITIQUE DE RETOUR — RETURN POLICY</div>
                <div style={{ fontSize: '7pt', color: '#555', lineHeight: 1.6 }}>
                  En cas de problème avec votre commande, conservez ce bon et contactez NAFA dans les 7 jours suivant la réception.
                  Présentez ce document et le produit à retourner dans son emballage d&apos;origine.
                </div>
                <div style={{ marginTop: '2mm', fontSize: '6.5pt', color: '#aaa' }}>
                  Réf : {order.id} — nafa.bf
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
