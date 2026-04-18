'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Store } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cartStore';
import { useUiStore } from '@/stores/uiStore';
import { formatCurrency, clientPrice, FREE_DELIVERY_THRESHOLD } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getSubtotal, getDeliveryFee, getTotal, getVendorGroups } = useCartStore();
  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();
  const vendorGroups = getVendorGroups();
  const multiVendor = vendorGroups.length > 1;
  const currency = useUiStore((s) => s.currency);

  // For single-vendor free delivery progress bar
  const singleGroup = !multiVendor ? vendorGroups[0] : null;
  const progress = singleGroup ? Math.min((singleGroup.subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100) : 0;
  const remaining = singleGroup ? FREE_DELIVERY_THRESHOLD - singleGroup.subtotal : 0;

  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemove = (productId: string) => {
    setRemoving(productId);
    setTimeout(() => { removeItem(productId); setRemoving(null); }, 200);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center" style={{ background: 'var(--nafa-white)' }}>
        <EmptyState
          icon={ShoppingBag}
          title="Votre panier est vide"
          description="Découvrez nos produits et commencez votre shopping."
          action={{ label: 'Explorer les produits', onClick: () => router.push('/home') }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh" style={{ background: 'var(--nafa-white)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10">
        <header className="pt-6 pb-4">
          <h1 className="text-xl font-bold" style={{ color: 'var(--nafa-black)' }}>
            Mon panier ({items.length} article{items.length > 1 ? 's' : ''})
          </h1>
        </header>

        {/* Single-vendor free delivery banner */}
        {!multiVendor && singleGroup && (
          <div className="mb-4 p-3 rounded-2xl" style={{ background: 'var(--nafa-gray-100)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Truck size={15} strokeWidth={1.75}
                style={{ color: singleGroup.deliveryFee === 0 ? 'var(--nafa-green)' : 'var(--nafa-gray-700)' }} />
              {singleGroup.deliveryFee === 0 ? (
                <p className="text-sm font-medium" style={{ color: 'var(--nafa-green)' }}>Livraison gratuite appliquée !</p>
              ) : (
                <p className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>
                  Plus que <strong className="nafa-mono">{formatCurrency(remaining, currency)}</strong> pour la livraison gratuite
                </p>
              )}
            </div>
            {singleGroup.deliveryFee > 0 && (
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--nafa-gray-200)' }}>
                <motion.div className="h-full rounded-full" style={{ background: 'var(--nafa-orange)', width: `${progress}%` }}
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
              </div>
            )}
          </div>
        )}

        <div className="lg:flex lg:gap-8 lg:items-start">
          {/* Items — grouped by vendor */}
          <div className="lg:flex-1 space-y-4">
            {vendorGroups.map((group) => (
              <div key={group.vendorId}>
                {/* Vendor header */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Store size={13} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--nafa-gray-700)' }}>
                    {group.vendorName}
                  </span>
                  {multiVendor && (
                    <span className="text-xs ml-auto" style={{ color: 'var(--nafa-gray-400)' }}>
                      Livraison : {group.deliveryFee === 0
                        ? <span style={{ color: 'var(--nafa-green)' }}>GRATUITE</span>
                        : formatCurrency(group.deliveryFee, currency)}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <AnimatePresence>
                    {group.items.map((item) => (
                      <motion.div key={item.productId} layout
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: removing === item.productId ? 0 : 1, x: 0 }}
                        exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="flex gap-3 p-3 rounded-2xl bg-white border"
                        style={{ borderColor: 'var(--nafa-gray-200)' }}>
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                          {item.image && (
                            <Image src={item.image} alt={item.title} width={80} height={80} className="object-cover w-full h-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2 mb-2" style={{ color: 'var(--nafa-black)' }}>
                            {item.title}
                          </p>
                          <p className="text-base font-bold nafa-mono" style={{ color: 'var(--nafa-orange)' }}>
                            {formatCurrency(clientPrice(item.price) * item.quantity, currency)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleRemove(item.productId)}
                            aria-label={`Supprimer ${item.title}`}>
                            <Trash2 size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-error)' }} />
                          </motion.button>
                          <div className="flex items-center gap-2 rounded-xl border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
                            <motion.button whileTap={{ scale: 0.9 }}
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center" aria-label="Diminuer">
                              <Minus size={12} strokeWidth={2} style={{ color: 'var(--nafa-gray-700)' }} />
                            </motion.button>
                            <span className="text-sm font-semibold nafa-mono w-4 text-center" style={{ color: 'var(--nafa-black)' }}>
                              {item.quantity}
                            </span>
                            <motion.button whileTap={{ scale: 0.9 }}
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              className="w-7 h-7 flex items-center justify-center" aria-label="Augmenter">
                              <Plus size={12} strokeWidth={2}
                                style={{ color: item.quantity >= item.stock ? 'var(--nafa-gray-400)' : 'var(--nafa-gray-700)' }} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>

          {/* Summary + CTA */}
          <div className="lg:w-80 lg:sticky lg:top-4">
            <div className="mt-6 lg:mt-0 p-4 rounded-2xl" style={{ background: 'var(--nafa-gray-100)' }}>
              {/* Per-vendor breakdown if multi-vendor */}
              {multiVendor && (
                <div className="mb-3 space-y-2">
                  {vendorGroups.map((g) => (
                    <div key={g.vendorId}>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--nafa-gray-700)' }}>{g.vendorName}</p>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--nafa-gray-400)' }}>Sous-total</span>
                        <span className="nafa-mono">{formatCurrency(g.subtotal, currency)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--nafa-gray-400)' }}>Livraison</span>
                        <span className="nafa-mono" style={{ color: g.deliveryFee === 0 ? 'var(--nafa-green)' : undefined }}>
                          {g.deliveryFee === 0 ? 'GRATUIT' : formatCurrency(g.deliveryFee, currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="h-px my-2" style={{ background: 'var(--nafa-gray-200)' }} />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--nafa-gray-700)' }}>Sous-total</span>
                  <span className="nafa-mono font-medium" style={{ color: 'var(--nafa-black)' }}>{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--nafa-gray-700)' }}>Frais de livraison</span>
                  <span className="nafa-mono font-medium" style={{ color: deliveryFee === 0 ? 'var(--nafa-green)' : 'var(--nafa-black)' }}>
                    {deliveryFee === 0 ? 'GRATUIT' : formatCurrency(deliveryFee, currency)}
                  </span>
                </div>
                <div className="h-px my-2" style={{ background: 'var(--nafa-gray-200)' }} />
                <div className="flex justify-between">
                  <span className="font-semibold" style={{ color: 'var(--nafa-black)' }}>Total</span>
                  <span className="text-lg font-black nafa-mono" style={{ color: 'var(--nafa-orange)' }}>{formatCurrency(total, currency)}</span>
                </div>
                {multiVendor && (
                  <p className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>
                    {vendorGroups.length} commandes séparées seront créées (une par vendeur)
                  </p>
                )}
              </div>
            </div>

            <div className="pb-4 mt-4">
              <motion.button whileTap={{ scale: 0.98 }} whileHover={{ translateY: -1 }}
                onClick={() => router.push('/checkout')}
                className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'var(--nafa-orange)' }}>
                Passer la commande
                <ArrowRight size={18} strokeWidth={1.75} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
