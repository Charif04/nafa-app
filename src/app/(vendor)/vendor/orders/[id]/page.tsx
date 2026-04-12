'use client';
import { use, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronRight, CheckCircle2, AlertTriangle, Package,
} from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { OrderStatusStepper } from '@/components/shared/OrderStatusStepper';
import { formatCurrency } from '@/lib/utils';
import {
  useVendorOrdersStore,
  VENDOR_TRANSITIONS,
  VENDOR_TRANSITION_LABELS,
} from '@/stores/vendorOrdersStore';
import { useAuthStore } from '@/stores/authStore';


const sectionVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.32 } } };

export default function VendorOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getOrder, advanceStatus, fetchOrders, orders, isLoading, subscribeRealtime, unsubscribe } = useVendorOrdersStore();
  const user = useAuthStore((s) => s.user);
  const order = getOrder(id);

  useEffect(() => {
    if (orders.length === 0) fetchOrders();
    if (user?.uid) subscribeRealtime(user.uid);

    const onVisible = () => { if (document.visibilityState === 'visible') void fetchOrders(); };
    document.addEventListener('visibilitychange', onVisible);

    const poll = setInterval(() => void fetchOrders(), 20000);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(poll);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  if (!order) {
    if (isLoading) {
      return (
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-4">
          <div className="h-10 w-48 rounded-xl animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
          <div className="h-32 rounded-2xl animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
          <div className="h-48 rounded-2xl animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
        </div>
      );
    }
    return (
      <div className="p-8 text-center">
        <p className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>Commande introuvable.</p>
        <Link href="/vendor/orders" className="text-sm font-medium mt-4 inline-block" style={{ color: 'var(--nafa-orange)' }}>
          Retour aux commandes
        </Link>
      </div>
    );
  }

  const nextStatus = VENDOR_TRANSITIONS[order.orderStatus];
  const nextLabel = VENDOR_TRANSITION_LABELS[order.orderStatus];
  const isVendorDone = !nextStatus; // Plus d'action possible côté vendeur

  const handleAdvance = () => {
    void advanceStatus(order.id);
    setShowConfirm(false);
    setJustUpdated(true);
    setTimeout(() => setJustUpdated(false), 3000);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
        <Link href="/vendor/orders">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center border"
            style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-white)' }} aria-label="Retour">
            <ArrowLeft size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold nafa-mono tracking-tight" style={{ color: 'var(--nafa-black)' }}>
            Commande #{order.id.toUpperCase()}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }} suppressHydrationWarning>
            {new Date(order.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={order.orderStatus} />
        </div>
      </motion.div>

      {/* Toast succès */}
      <AnimatePresence>
        {justUpdated && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(0,200,83,0.1)', color: 'var(--nafa-green)', border: '1px solid rgba(0,200,83,0.2)' }}
          >
            <CheckCircle2 size={16} strokeWidth={1.75} />
            Statut mis à jour avec succès
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panneau d'action vendeur */}
      {nextStatus && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-6 p-5 rounded-2xl border" style={{ background: 'var(--nafa-white)', borderColor: 'var(--nafa-gray-200)' }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--nafa-black)' }}>Action requise</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--nafa-gray-700)' }}>
            {order.orderStatus === 'placed' && 'Confirmez la commande pour informer le client et démarrer la préparation.'}
            {order.orderStatus === 'confirmed' && 'Commencez la préparation des articles pour l\'expédition.'}
            {order.orderStatus === 'preparing' && 'Envoyez le colis vers l\'entrepôt NAFA pour la livraison finale.'}
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--nafa-orange)' }}
          >
            <ChevronRight size={15} strokeWidth={1.75} />
            {nextLabel}
          </motion.button>
        </motion.div>
      )}

      {/* Info : commande prise en charge par NAFA */}
      {isVendorDone && order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(26,115,232,0.06)', border: '1px solid rgba(26,115,232,0.15)' }}>
          <Package size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-blue)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--nafa-blue)' }}>Prise en charge par NAFA</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-700)' }}>
              Le colis est maintenant géré par l&apos;équipe NAFA. La livraison est en cours.
            </p>
          </div>
        </motion.div>
      )}

      {/* Modale de confirmation */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setShowConfirm(false)}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,107,44,0.1)' }}>
                  <AlertTriangle size={20} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>Confirmer l&apos;action ?</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-700)' }}>{nextLabel}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                  style={{ borderColor: 'var(--nafa-gray-200)', color: 'var(--nafa-gray-700)' }}>
                  Annuler
                </button>
                <button onClick={handleAdvance}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'var(--nafa-orange)' }}>
                  Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenu principal */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible"
        className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start space-y-6 lg:space-y-0">

        {/* Colonne gauche : articles + récap */}
        <div className="space-y-6">
          {/* Articles */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: 'var(--nafa-gray-200)' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--nafa-gray-200)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--nafa-black)' }}>
                Articles ({order.items.reduce((acc, it) => acc + it.quantity, 0)})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px]">
                <thead>
                  <tr style={{ background: 'var(--nafa-gray-100)' }}>
                    {['Produit', 'Qté', 'Prix', 'Total'].map((h) => (
                      <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--nafa-gray-400)' }}>{h}</th>
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

          {/* Récapitulatif financier */}
          {(() => {
            // order.subtotal = client price (vendor price × 1.1)
            // Vendor earns their set price; NAFA's markup is added on top for the client
            const vendorPrice = Math.round(order.subtotal / 1.1);
            const nafaCommission = order.subtotal - vendorPrice;
            return (
              <motion.div variants={itemVariants} className="bg-white rounded-2xl border p-6"
                style={{ borderColor: 'var(--nafa-gray-200)' }}>
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--nafa-black)' }}>Récapitulatif</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>Votre prix de vente</span>
                    <span className="text-sm font-medium nafa-mono" style={{ color: 'var(--nafa-black)' }}>{formatCurrency(vendorPrice, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: 'var(--nafa-gray-400)' }}>Markup NAFA (+10%)</span>
                    <span className="text-sm nafa-mono" style={{ color: 'var(--nafa-gray-400)' }}>
                      +{formatCurrency(nafaCommission, order.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>Prix payé par le client</span>
                    <span className="text-sm font-medium nafa-mono" style={{ color: 'var(--nafa-black)' }}>
                      {formatCurrency(order.subtotal + order.deliveryFee, order.currency)}
                    </span>
                  </div>
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between text-xs" style={{ color: 'var(--nafa-gray-400)' }}>
                      <span>dont frais de livraison</span>
                      <span className="nafa-mono">{formatCurrency(order.deliveryFee, order.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3" style={{ borderTop: '1px solid var(--nafa-gray-200)' }}>
                    <span className="text-base font-bold" style={{ color: 'var(--nafa-black)' }}>Vos revenus</span>
                    <span className="text-base font-black nafa-mono" style={{ color: 'var(--nafa-green)' }}>
                      {formatCurrency(vendorPrice, order.currency)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </div>

        {/* Colonne droite : suivi + livraison + paiement */}
        <div className="space-y-6">
          {/* Stepper de suivi */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl border p-6"
            style={{ borderColor: 'var(--nafa-gray-200)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--nafa-black)' }}>Suivi de la commande</h2>
            <OrderStatusStepper currentStatus={order.orderStatus} statusHistory={order.statusHistory} />
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}
