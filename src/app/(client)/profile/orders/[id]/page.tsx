'use client';
import { use, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, CreditCard, Clock, Package, Star, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OrderStatusStepper } from '@/components/shared/OrderStatusStepper';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ReviewModal } from '@/components/shared/ReviewModal';
import { formatCurrency, clientPrice } from '@/lib/utils';
import { useClientOrdersStore } from '@/stores/clientOrdersStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

const PAYMENT_LABELS = {
  orange_money: 'Orange Money',
  moov_money: 'Moov Money',
  card: 'Carte bancaire',
};

const PAYMENT_COLORS = {
  orange_money: '#FF6600',
  moov_money: '#0099CC',
  card: '#1a1a2e',
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { getOrder, fetchOrders, orders, isLoading, subscribeRealtime, unsubscribe } = useClientOrdersStore();

  const [hasReviewed, setHasReviewed] = useState<boolean | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Always fetch on mount — store may hold stale data from the orders list
    void fetchOrders();
    if (user?.uid) subscribeRealtime(user.uid);

    const onVisible = () => { if (document.visibilityState === 'visible') void fetchOrders(); };
    document.addEventListener('visibilitychange', onVisible);

    // Poll every 10s while on detail page — user is actively watching for updates
    const poll = setInterval(() => void fetchOrders(), 10000);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(poll);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  const order = getOrder(id);

  // Check if review already exists for this order
  useEffect(() => {
    if (!order || !user || order.orderStatus !== 'delivered') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('reviews')
      .select('id')
      .eq('order_id', order.id)
      .eq('from_user_id', user.uid)
      .eq('type', 'client_to_vendor')
      .maybeSingle()
      .then(({ data }: { data: { id: string } | null }) => {
        setHasReviewed(!!data);
      });
  }, [order, user]);

  const handleReviewSubmitted = () => {
    setShowReviewModal(false);
    setReviewSubmitted(true);
    setHasReviewed(true);
  };

  if (!order) {
    // Show skeleton until the fetch has run at least once (isLoading=true) OR store is empty
    if (isLoading || orders.length === 0) {
      return (
        <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
          <div className="px-4 md:px-6 lg:px-10">
            <header className="flex items-center gap-3 py-4 sticky top-0 md:top-16 z-10"
              style={{ background: 'var(--nafa-white)', borderBottom: '1px solid var(--nafa-gray-200)' }}>
              <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
              <div className="h-4 w-32 rounded animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
            </header>
            <div className="py-4 space-y-4">
              <div className="h-32 rounded-2xl animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
              <div className="h-48 rounded-2xl animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 p-8">
        <Package size={40} strokeWidth={1.5} style={{ color: 'var(--nafa-gray-400)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--nafa-gray-700)' }}>Commande introuvable.</p>
        <Link href="/profile/orders" className="text-sm font-semibold" style={{ color: 'var(--nafa-orange)' }}>
          Retour aux commandes
        </Link>
      </div>
    );
  }

  const canReview = order.orderStatus === 'delivered' && hasReviewed === false;

  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-gray-100)' }}>
      <header className="flex items-center gap-3 px-4 md:px-6 lg:px-10 py-4 sticky top-0 md:top-16 z-10"
        style={{ background: 'var(--nafa-white)', borderBottom: '1px solid var(--nafa-gray-200)' }}>
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--nafa-gray-100)' }} aria-label="Retour">
            <ChevronLeft size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-black)' }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold nafa-mono" style={{ color: 'var(--nafa-black)' }}>
              #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-xs" style={{ color: 'var(--nafa-gray-700)' }} suppressHydrationWarning>
              {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <StatusBadge status={order.orderStatus} />
          <button onClick={() => void handleRefresh()} disabled={isRefreshing}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-50"
            style={{ background: 'var(--nafa-gray-100)' }} aria-label="Rafraîchir">
            <RefreshCw size={15} strokeWidth={1.75}
              style={{ color: 'var(--nafa-gray-700)' }}
              className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </header>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 md:px-6 lg:px-10 py-4">

          {/* Review CTA — shown after delivery if no review yet */}
          {canReview && !reviewSubmitted && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 rounded-2xl flex items-center gap-3"
              style={{ background: 'rgba(255,107,44,0.07)', border: '1px solid rgba(255,107,44,0.2)' }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,107,44,0.12)' }}>
                <Star size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--nafa-black)' }}>
                  Votre commande est livrée !
                </p>
                <p className="text-xs" style={{ color: 'var(--nafa-gray-700)' }}>
                  Donnez votre avis sur {order.vendorName}
                </p>
              </div>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowReviewModal(true)}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: 'var(--nafa-orange)' }}>
                Évaluer
              </motion.button>
            </motion.div>
          )}

          {reviewSubmitted && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 rounded-2xl flex items-center gap-3"
              style={{ background: 'rgba(0,200,83,0.07)', border: '1px solid rgba(0,200,83,0.2)' }}>
              <Star size={18} strokeWidth={1.75} className="text-green-500 flex-shrink-0" />
              <p className="text-sm font-medium text-green-700">Avis publié — merci !</p>
            </motion.div>
          )}

          <div className="lg:flex lg:gap-6 lg:items-start space-y-4 lg:space-y-0">
            {/* Left column */}
            <div className="lg:flex-1 space-y-4">
              {/* Items */}
              <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--nafa-gray-400)' }}>
                  Produits commandés ({order.items.length})
                </p>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.productId} className="flex gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--nafa-gray-100)' }}>
                        {item.image
                          ? <Image src={item.image} alt={item.title} width={64} height={64} className="object-cover w-full h-full" />
                          : <div className="w-full h-full flex items-center justify-center"><Package size={20} style={{ color: 'var(--nafa-gray-400)' }} /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>{item.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-700)' }}>Qté : {item.quantity}</p>
                        <p className="text-sm font-bold nafa-mono mt-1" style={{ color: 'var(--nafa-orange)' }}>
                          {formatCurrency(clientPrice(item.price) * item.quantity, order.currency)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-4 pt-3 space-y-1.5" style={{ borderColor: 'var(--nafa-gray-200)' }}>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--nafa-gray-700)' }}>Sous-total</span>
                    <span className="nafa-mono" style={{ color: 'var(--nafa-black)' }}>{formatCurrency(order.subtotal, order.currency)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--nafa-gray-700)' }}>Livraison</span>
                    <span className="nafa-mono" style={{ color: order.deliveryFee === 0 ? 'var(--nafa-green)' : 'var(--nafa-black)' }}>
                      {order.deliveryFee === 0 ? 'GRATUIT' : formatCurrency(order.deliveryFee, order.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t" style={{ borderColor: 'var(--nafa-gray-100)' }}>
                    <span style={{ color: 'var(--nafa-black)' }}>Total payé</span>
                    <span className="nafa-mono" style={{ color: 'var(--nafa-orange)' }}>{formatCurrency(order.total, order.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Vendor */}
              <Link href={`/vendor/${order.vendorId}`}
                className="flex items-center gap-3 bg-white rounded-2xl p-4 border hover:shadow-sm transition-shadow"
                style={{ borderColor: 'var(--nafa-gray-200)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--nafa-orange), #e55a00)' }}>
                  {order.vendorName?.[0] ?? 'V'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>Vendu par</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--nafa-black)' }}>{order.vendorName}</p>
                </div>
                <ChevronLeft size={16} strokeWidth={1.75} className="rotate-180" style={{ color: 'var(--nafa-gray-400)' }} />
              </Link>
            </div>

            {/* Right column */}
            <div className="lg:w-80 space-y-4">
              <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--nafa-gray-900)' }}>Suivi de commande</h2>
                </div>
                <OrderStatusStepper currentStatus={order.orderStatus} statusHistory={order.statusHistory} />
              </div>

              <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--nafa-gray-900)' }}>Adresse de livraison</h2>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--nafa-gray-700)' }}>
                  {order.deliveryAddress.street}<br />
                  {order.deliveryAddress.city}{order.deliveryAddress.region ? `, ${order.deliveryAddress.region}` : ''}<br />
                  {order.deliveryAddress.country}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--nafa-gray-900)' }}>Paiement</h2>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: PAYMENT_COLORS[order.paymentMethod] }}>
                      <CreditCard size={13} strokeWidth={1.75} className="text-white" />
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>
                      {PAYMENT_LABELS[order.paymentMethod]}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">Payé</span>
                </div>
              </div>
            </div>
          </div>
      </motion.div>

      {/* Review modal */}
      {showReviewModal && (
        <ReviewModal
          orderId={order.id}
          vendorId={order.vendorId}
          vendorName={order.vendorName ?? 'Boutique'}
          onClose={() => setShowReviewModal(false)}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}
