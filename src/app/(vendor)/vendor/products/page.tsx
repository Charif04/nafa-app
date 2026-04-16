'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Package, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/shared/SkeletonShimmer';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Product } from '@/types';

export default function VendorProductsPage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      loadProducts(currentUser.uid);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  async function loadProducts(userId: string) {
    setIsLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('vendor_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setProducts(data.map((row: any) => ({
        id: row.id,
        vendorId: row.vendor_id,
        title: row.title,
        description: row.description ?? '',
        price: Number(row.price),
        currency: row.currency,
        images: row.images ?? [],
        category: row.category ?? '',
        stock: row.stock,
        rating: Number(row.rating),
        reviewCount: row.review_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })));
    }
    setIsLoading(false);
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('products').update({ is_active: false }).eq('id', id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
    setIsDeleting(false);
  };

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--nafa-black)' }}>Mes produits</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--nafa-gray-700)' }}>
            {isLoading ? '...' : `${products.length} produit${products.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/vendor/products/new">
          <motion.button whileTap={{ scale: 0.97 }} whileHover={{ translateY: -1 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--nafa-orange)' }}>
            <Plus size={16} strokeWidth={1.75} />
            Nouveau produit
          </motion.button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }} />
        <input
          type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full max-w-sm pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-white)' }}
        />
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--nafa-gray-200)' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0" style={{ borderColor: 'var(--nafa-gray-100)' }}>
              <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun produit"
          description={search ? 'Aucun résultat pour cette recherche.' : 'Ajoutez votre premier produit pour commencer à vendre.'}
          action={!search ? { label: 'Ajouter un produit', onClick: () => router.push('/vendor/products/new') } : undefined}
        />
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--nafa-gray-200)' }}>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr style={{ background: 'var(--nafa-gray-100)', borderBottom: '1px solid var(--nafa-gray-200)' }}>
                  {['Produit', 'Prix vendeur', 'Stock', 'Note', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((product, i) => (
                    <motion.tr
                      key={product.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{ borderBottom: '1px solid var(--nafa-gray-100)' }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--nafa-gray-100)' }}>
                            {product.images[0] ? (
                              <Image src={product.images[0]} alt={product.title} width={48} height={48} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={18} style={{ color: 'var(--nafa-gray-400)' }} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium line-clamp-1" style={{ color: 'var(--nafa-black)' }}>{product.title}</p>
                            <p className="text-xs capitalize" style={{ color: 'var(--nafa-gray-700)' }}>{product.category || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold nafa-mono" style={{ color: 'var(--nafa-black)' }}>
                          {formatCurrency(product.price, product.currency)}
                        </span>
                        <p className="text-xs nafa-mono" style={{ color: 'var(--nafa-gray-400)' }}>
                          client : {formatCurrency(Math.round(product.price * 1.1), product.currency)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          product.stock === 0 ? 'bg-red-50 text-red-600' :
                          product.stock <= 3 ? 'bg-orange-50 text-orange-600' :
                          product.stock <= 8 ? 'bg-yellow-50 text-yellow-700' :
                          'bg-green-50 text-green-700'
                        }`}>
                          {product.stock === 0 ? 'Épuisé' : product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                          <span className="text-sm font-medium nafa-mono" style={{ color: 'var(--nafa-black)' }}>
                            {product.rating.toFixed(1)}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>({product.reviewCount})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/vendor/products/${product.id}/edit`}>
                            <motion.button whileTap={{ scale: 0.9 }}
                              className="w-8 h-8 rounded-xl flex items-center justify-center"
                              style={{ background: 'var(--nafa-gray-100)' }}
                              aria-label={`Modifier ${product.title}`}>
                              <Pencil size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />
                            </motion.button>
                          </Link>
                          <motion.button whileTap={{ scale: 0.9 }}
                            onClick={() => setDeleteId(product.id)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-50"
                            aria-label={`Supprimer ${product.title}`}>
                            <Trash2 size={14} strokeWidth={1.75} className="text-red-500" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y" style={{ borderColor: 'var(--nafa-gray-100)' }}>
            <AnimatePresence>
              {filtered.map((product, i) => (
                <motion.div key={product.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03 }} className="p-4 flex gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--nafa-gray-100)' }}>
                    {product.images[0] ? (
                      <Image src={product.images[0]} alt={product.title} width={56} height={56} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={20} style={{ color: 'var(--nafa-gray-400)' }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold line-clamp-1" style={{ color: 'var(--nafa-black)' }}>{product.title}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        product.stock === 0 ? 'bg-red-50 text-red-600' :
                        product.stock <= 3 ? 'bg-orange-50 text-orange-600' :
                        'bg-green-50 text-green-700'
                      }`}>
                        {product.stock === 0 ? 'Épuisé' : `${product.stock} en stock`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold nafa-mono" style={{ color: 'var(--nafa-black)' }}>{formatCurrency(product.price, product.currency)}</span>
                      <div className="flex items-center gap-2">
                        <Link href={`/vendor/products/${product.id}/edit`}>
                          <motion.button whileTap={{ scale: 0.9 }}
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: 'var(--nafa-gray-100)' }}
                            aria-label={`Modifier ${product.title}`}>
                            <Pencil size={13} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />
                          </motion.button>
                        </Link>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => setDeleteId(product.id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-50"
                          aria-label={`Supprimer ${product.title}`}>
                          <Trash2 size={13} strokeWidth={1.75} className="text-red-500" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--nafa-black)' }}>Supprimer ce produit ?</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--nafa-gray-700)' }}>
                Le produit sera retiré de la boutique et ne sera plus visible par les clients.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
                  style={{ borderColor: 'var(--nafa-gray-200)', color: 'var(--nafa-gray-700)' }}>
                  Annuler
                </button>
                <button onClick={() => handleDelete(deleteId)} disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 flex items-center justify-center">
                  {isDeleting
                    ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
