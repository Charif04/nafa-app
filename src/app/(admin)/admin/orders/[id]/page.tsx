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


function ShippingLabelModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const labelRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const content = labelRef.current?.innerHTML ?? '';
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>Étiquette ${formatOrderId(order.id)}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Arial', sans-serif; background: #fff; color: #111; }
          .label { width: 148mm; min-height: 105mm; padding: 6mm; border: 2px solid #111; page-break-inside: avoid; }
          .label-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #FF6B2C; padding-bottom: 3mm; margin-bottom: 3mm; }
          .brand { font-size: 22pt; font-weight: 900; letter-spacing: 0.05em; color: #FF6B2C; }
          .brand span { color: #111; }
          .order-id { font-size: 14pt; font-weight: 700; font-family: monospace; color: #FF6B2C; }
          .date { font-size: 8pt; color: #555; margin-top: 1mm; }
          .section { margin-bottom: 3mm; }
          .section-title { font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; border-bottom: 1px solid #eee; padding-bottom: 1mm; margin-bottom: 2mm; }
          .recipient-name { font-size: 14pt; font-weight: 700; }
          .recipient-phone { font-size: 11pt; font-weight: 600; color: #FF6B2C; }
          .address { font-size: 9pt; color: #333; margin-top: 1mm; }
          .items-list { font-size: 8pt; }
          .item-row { display: flex; justify-content: space-between; padding: 0.5mm 0; border-bottom: 1px solid #f0f0f0; }
          .total-row { display: flex; justify-content: space-between; font-weight: 700; font-size: 10pt; padding-top: 1.5mm; margin-top: 1mm; border-top: 2px solid #111; }
          .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
          .footer { margin-top: 3mm; padding-top: 2mm; border-top: 1px dashed #ccc; font-size: 7pt; color: #888; }
          .return-box { border: 1px dashed #FF6B2C; padding: 2mm; border-radius: 2mm; margin-top: 2mm; }
          .return-box-title { font-size: 7pt; font-weight: 700; color: #FF6B2C; text-transform: uppercase; margin-bottom: 1mm; }
          .return-box p { font-size: 7pt; color: #555; }
          .barcode-area { text-align: center; font-family: monospace; font-size: 18pt; letter-spacing: 0.15em; border: 1px solid #eee; padding: 2mm; border-radius: 2mm; background: #fafafa; }
          .barcode-sub { font-size: 7pt; color: #999; margin-top: 0.5mm; }
          @media print {
            @page { size: A6 landscape; margin: 0; }
            body { margin: 0; }
          }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  const addr = order.deliveryAddress;
  const printDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const orderDate = new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--nafa-gray-200)' }}>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--nafa-black)' }}>Étiquette d&apos;expédition</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }}>{formatOrderId(order.id)}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--nafa-orange)' }}
            >
              <Printer size={15} strokeWidth={1.75} />
              Imprimer
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }}>
              <XIcon size={16} strokeWidth={2} style={{ color: 'var(--nafa-gray-700)' }} />
            </button>
          </div>
        </div>

        {/* Label preview */}
        <div className="p-6 overflow-y-auto max-h-[75vh]" style={{ background: 'var(--nafa-gray-100)' }}>
          <div
            ref={labelRef}
            style={{
              background: 'white',
              border: '2px solid #111',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '560px',
              margin: '0 auto',
              fontFamily: 'Arial, sans-serif',
            }}
            className="label"
          >
            {/* Header */}
            <div className="label-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #FF6B2C', paddingBottom: '10px', marginBottom: '12px' }}>
              <div>
                <div className="brand" style={{ fontSize: '22pt', fontWeight: 900, letterSpacing: '0.05em', color: '#FF6B2C' }}>
                  N<span style={{ color: '#111' }}>A</span>F<span style={{ color: '#111' }}>A</span>
                </div>
                <div style={{ fontSize: '7pt', color: '#888', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Marketplace Africaine</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="order-id" style={{ fontSize: '14pt', fontWeight: 700, fontFamily: 'monospace', color: '#FF6B2C' }}>
                  {formatOrderId(order.id)}
                </div>
                <div className="date" style={{ fontSize: '8pt', color: '#555', marginTop: '3px' }}>Commande du {orderDate}</div>
                <div className="date" style={{ fontSize: '8pt', color: '#555' }}>Imprimé le {printDate}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Left: Recipient + return */}
              <div>
                <div className="section" style={{ marginBottom: '10px' }}>
                  <div className="section-title" style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '6px' }}>
                    📦 DESTINATAIRE
                  </div>
                  <div className="recipient-name" style={{ fontSize: '14pt', fontWeight: 700 }}>
                    {order.clientName ?? '—'}
                  </div>
                  {order.clientPhone && (
                    <div className="recipient-phone" style={{ fontSize: '11pt', fontWeight: 600, color: '#FF6B2C', marginTop: '2px' }}>
                      {order.clientPhone}
                    </div>
                  )}
                  <div className="address" style={{ fontSize: '9pt', color: '#333', marginTop: '4px', lineHeight: 1.5 }}>
                    {addr.street && <div>{addr.street}</div>}
                    <div style={{ fontWeight: 600 }}>{addr.city}{addr.region ? `, ${addr.region}` : ''}</div>
                    <div>{addr.country}</div>
                  </div>
                </div>

                <div className="return-box" style={{ border: '1px dashed #FF6B2C', padding: '6px', borderRadius: '4px', marginTop: '8px' }}>
                  <div className="return-box-title" style={{ fontSize: '7pt', fontWeight: 700, color: '#FF6B2C', textTransform: 'uppercase', marginBottom: '3px' }}>
                    ↩ Retour / Réclamation
                  </div>
                  <div style={{ fontSize: '7pt', color: '#555', lineHeight: 1.5 }}>
                    <div>Conservez ce bon jusqu&apos;à réception.</div>
                    <div>En cas de problème, contactez NAFA avec l&apos;ID commande.</div>
                    <div style={{ marginTop: '2px', fontWeight: 600 }}>support@nafa.market</div>
                  </div>
                </div>
              </div>

              {/* Right: Items + totals + vendor */}
              <div>
                <div className="section" style={{ marginBottom: '10px' }}>
                  <div className="section-title" style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '6px' }}>
                    🛍 CONTENU ({order.items.reduce((s, it) => s + it.quantity, 0)} article{order.items.reduce((s, it) => s + it.quantity, 0) > 1 ? 's' : ''})
                  </div>
                  <div className="items-list" style={{ fontSize: '8pt' }}>
                    {order.items.map((item) => (
                      <div key={item.productId} className="item-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <span style={{ flex: 1, paddingRight: '6px', color: '#333' }}>{item.title} ×{item.quantity}</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatCurrency(item.price * item.quantity, order.currency)}</span>
                      </div>
                    ))}
                    {order.deliveryFee > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: '#888', fontSize: '7.5pt' }}>
                        <span>Livraison</span>
                        <span style={{ fontFamily: 'monospace' }}>{formatCurrency(order.deliveryFee, order.currency)}</span>
                      </div>
                    )}
                    <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '10pt', paddingTop: '5px', marginTop: '4px', borderTop: '2px solid #111' }}>
                      <span>TOTAL PAYÉ</span>
                      <span style={{ fontFamily: 'monospace', color: '#FF6B2C' }}>{formatCurrency(order.total, order.currency)}</span>
                    </div>
                  </div>
                </div>

                <div className="section" style={{ marginBottom: '8px' }}>
                  <div className="section-title" style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '6px' }}>
                    🏪 EXPÉDITEUR
                  </div>
                  <div style={{ fontSize: '9pt', fontWeight: 600 }}>{order.vendorName ?? 'Boutique NAFA'}</div>
                  <div style={{ fontSize: '8pt', color: '#888' }}>via NAFA Marketplace</div>
                </div>

                <div className="barcode-area" style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '14pt', letterSpacing: '0.2em', border: '1px solid #eee', padding: '6px', borderRadius: '4px', background: '#fafafa' }}>
                  {formatOrderId(order.id)}
                  <div className="barcode-sub" style={{ fontSize: '7pt', color: '#999', marginTop: '2px', letterSpacing: '0' }}>Référence de suivi NAFA</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="footer" style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #ccc', fontSize: '7pt', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
              <span>NAFA Marketplace — Burkina Faso</span>
              <span>www.nafa.market</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
