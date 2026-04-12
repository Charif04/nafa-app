'use client';
import { use, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, User, MapPin, Phone, CreditCard, Smartphone,
  ChevronRight, AlertTriangle, CheckCircle2, XCircle, Store, Hash,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { OrderStatusStepper } from '@/components/shared/OrderStatusStepper';
import { formatCurrency } from '@/lib/utils';
import {
  useAdminOrdersStore,
  ADMIN_TRANSITIONS,
  ADMIN_TRANSITION_LABELS,
} from '@/stores/adminOrdersStore';

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

  useEffect(() => {
    if (orders.length === 0) fetchOrders();
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

  const handleAdvance = async () => {
    setConfirmAction(null);
    setIsUpdating(true);
    setUpdateError(null);
    try {
      await advanceStatus(order.id);
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
      await cancelOrder(order.id);
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
            Commande #{order.id}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }} suppressHydrationWarning>
            {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={order.orderStatus} />
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
    </div>
  );
}
