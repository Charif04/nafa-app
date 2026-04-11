'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BadgeCheck, Ban, RefreshCw, Star, X, ExternalLink, Phone, MapPin, Store, Clock, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/shared/SkeletonShimmer';
import { supabase } from '@/lib/supabase';
import { getCnibSignedUrl } from '@/lib/api/storage';

interface VendorRow {
  id: string;
  shopName: string;
  shopDescription: string | null;
  shopType: 'online' | 'physical';
  shopAddress: string | null;
  isVerified: boolean;
  isSuspended: boolean;
  isPending: boolean;
  cnibUrl: string | null;
  rating: number;
  totalSales: number;
  totalRevenue: number;
  followerCount: number;
  createdAt: string;
  // from profiles join
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  country: string;
  region: string | null;
}

type FilterTab = 'tous' | 'en_attente' | 'verifies' | 'suspendus';

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('tous');
  const [selected, setSelected] = useState<VendorRow | null>(null);
  const [cnibSignedUrl, setCnibSignedUrl] = useState<string | null>(null);
  const [cnibLoading, setCnibLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadVendors(); }, []);

  async function loadVendors() {
    setIsLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('vendor_profiles')
      .select(`
        id, shop_name, shop_description, shop_type, shop_address,
        is_verified, is_suspended, is_pending, cnib_url,
        rating, total_sales, total_revenue, follower_count, created_at,
        profile:profiles!vendor_profiles_id_fkey(first_name, last_name, phone, country, region),
        auth_user:profiles!vendor_profiles_id_fkey(id)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      // fetch emails from profiles (email is in auth.users, not profiles)
      // We'll fetch them separately
      const ids: string[] = data.map((r: any) => r.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profilesData } = await (supabase as any)
        .from('profiles')
        .select('id, first_name, last_name, phone, country, region')
        .in('id', ids);

      const profileMap: Record<string, any> = {};
      (profilesData ?? []).forEach((p: any) => { profileMap[p.id] = p; });

      setVendors(data.map((r: any) => {
        const p = profileMap[r.id] ?? {};
        return {
          id: r.id,
          shopName: r.shop_name,
          shopDescription: r.shop_description,
          shopType: r.shop_type,
          shopAddress: r.shop_address,
          isVerified: r.is_verified,
          isSuspended: r.is_suspended,
          isPending: r.is_pending,
          cnibUrl: r.cnib_url,
          rating: Number(r.rating),
          totalSales: r.total_sales,
          totalRevenue: Number(r.total_revenue),
          followerCount: r.follower_count,
          createdAt: r.created_at,
          firstName: p.first_name ?? '',
          lastName: p.last_name ?? '',
          email: '',  // auth.users email not accessible via client
          phone: p.phone,
          country: p.country ?? '',
          region: p.region,
        };
      }));
    }
    setIsLoading(false);
  }

  async function openDetail(vendor: VendorRow) {
    setSelected(vendor);
    setCnibSignedUrl(null);
    if (vendor.cnibUrl) {
      setCnibLoading(true);
      try {
        const url = await getCnibSignedUrl(vendor.cnibUrl);
        setCnibSignedUrl(url);
      } catch { /* cnib unavailable */ }
      setCnibLoading(false);
    }
  }

  async function doAction(vendorId: string, action: 'certify' | 'suspend' | 'reactivate') {
    setActionLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    if (action === 'certify') {
      await db.from('vendor_profiles').update({ is_verified: true, is_pending: false }).eq('id', vendorId);
    } else if (action === 'suspend') {
      await db.from('vendor_profiles').update({ is_suspended: true }).eq('id', vendorId);
    } else {
      await db.from('vendor_profiles').update({ is_suspended: false }).eq('id', vendorId);
    }

    setVendors((prev) => prev.map((v) => {
      if (v.id !== vendorId) return v;
      if (action === 'certify') return { ...v, isVerified: true, isPending: false };
      if (action === 'suspend') return { ...v, isSuspended: true };
      return { ...v, isSuspended: false };
    }));

    if (selected?.id === vendorId) {
      setSelected((prev) => {
        if (!prev) return null;
        if (action === 'certify') return { ...prev, isVerified: true, isPending: false };
        if (action === 'suspend') return { ...prev, isSuspended: true };
        return { ...prev, isSuspended: false };
      });
    }

    setActionLoading(false);
  }

  const filtered = vendors.filter((v) => {
    const matchSearch =
      v.shopName.toLowerCase().includes(search.toLowerCase()) ||
      `${v.firstName} ${v.lastName}`.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === 'tous' ||
      (filter === 'en_attente' && v.isPending && !v.isSuspended) ||
      (filter === 'verifies' && v.isVerified && !v.isSuspended) ||
      (filter === 'suspendus' && v.isSuspended);

    return matchSearch && matchFilter;
  });

  const counts = {
    tous: vendors.length,
    en_attente: vendors.filter((v) => v.isPending && !v.isSuspended).length,
    verifies: vendors.filter((v) => v.isVerified && !v.isSuspended).length,
    suspendus: vendors.filter((v) => v.isSuspended).length,
  };

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'tous', label: 'Tous' },
    { key: 'en_attente', label: 'En attente' },
    { key: 'verifies', label: 'Vérifiés' },
    { key: 'suspendus', label: 'Suspendus' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--nafa-black)' }}>Vendeurs</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--nafa-gray-700)' }}>
          {isLoading ? '...' : `${vendors.length} vendeur${vendors.length > 1 ? 's' : ''} inscrits`}
        </p>
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={16} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }} />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un vendeur..." aria-label="Rechercher un vendeur"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none bg-white"
            style={{ borderColor: 'var(--nafa-gray-200)' }} />
        </div>
        <div className="flex items-center gap-1.5">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={filter === tab.key
                ? { background: 'var(--nafa-orange)', color: '#fff' }
                : { background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}>
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-white text-gray-500'}`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--nafa-gray-200)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr style={{ background: 'var(--nafa-gray-100)', borderBottom: '1px solid var(--nafa-gray-200)' }}>
                {['Boutique', 'Propriétaire', 'Ventes', 'Revenu', 'Note', 'Statut', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4].map((i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--nafa-gray-100)' }}>
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-16 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--nafa-gray-400)' }}>
                    Aucun vendeur trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((vendor, i) => (
                  <motion.tr key={vendor.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: '1px solid var(--nafa-gray-100)' }}>
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(vendor)} className="flex items-center gap-3 text-left">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ background: 'var(--nafa-orange)' }}>
                          {vendor.shopName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold hover:underline" style={{ color: 'var(--nafa-black)' }}>{vendor.shopName}</p>
                            {vendor.isVerified && <BadgeCheck size={13} strokeWidth={1.75} style={{ color: 'var(--nafa-blue)' }} />}
                          </div>
                          <p className="text-xs capitalize" style={{ color: 'var(--nafa-gray-400)' }}>{vendor.shopType === 'physical' ? 'Physique' : 'En ligne'}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>{vendor.firstName} {vendor.lastName}</p>
                      {vendor.phone && <p className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>{vendor.phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm nafa-mono font-medium" style={{ color: 'var(--nafa-black)' }}>{vendor.totalSales}</td>
                    <td className="px-4 py-3 text-sm font-bold nafa-mono" style={{ color: 'var(--nafa-black)' }}>{formatCurrency(vendor.totalRevenue, 'FCFA')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star size={12} strokeWidth={1.75} className="fill-[var(--nafa-orange)] text-[var(--nafa-orange)]" />
                        <span className="text-sm nafa-mono font-medium" style={{ color: 'var(--nafa-black)' }}>{vendor.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        vendor.isSuspended ? 'bg-red-50 text-red-700' :
                        vendor.isVerified ? 'bg-green-50 text-green-700' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {vendor.isSuspended ? 'Suspendu' : vendor.isVerified ? 'Vérifié' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => openDetail(vendor)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'var(--nafa-gray-100)' }} aria-label="Voir le dossier">
                          <ExternalLink size={13} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />
                        </motion.button>
                        {!vendor.isVerified && !vendor.isSuspended && (
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => doAction(vendor.id, 'certify')}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50" aria-label="Certifier">
                            <BadgeCheck size={13} strokeWidth={1.75} className="text-blue-600" />
                          </motion.button>
                        )}
                        {!vendor.isSuspended ? (
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => doAction(vendor.id, 'suspend')}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-50" aria-label="Suspendre">
                            <Ban size={13} strokeWidth={1.75} className="text-red-500" />
                          </motion.button>
                        ) : (
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => doAction(vendor.id, 'reactivate')}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-50" aria-label="Réactiver">
                            <RefreshCw size={13} strokeWidth={1.75} className="text-green-600" />
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
              style={{ maxHeight: '90dvh', overflowY: 'auto' }}>

              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--nafa-gray-200)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: 'var(--nafa-orange)' }}>
                    {selected.shopName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-base font-bold" style={{ color: 'var(--nafa-black)' }}>{selected.shopName}</h2>
                      {selected.isVerified && <BadgeCheck size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-blue)' }} />}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      selected.isSuspended ? 'bg-red-50 text-red-700' :
                      selected.isVerified ? 'bg-green-50 text-green-700' :
                      'bg-yellow-50 text-yellow-700'
                    }`}>
                      {selected.isSuspended ? 'Suspendu' : selected.isVerified ? 'Vérifié' : 'En attente de vérification'}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)' }}>
                  <X size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">

                {/* Infos propriétaire */}
                <section>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--nafa-gray-400)' }}>Propriétaire</p>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoRow icon={<span className="text-base">👤</span>} label="Nom complet" value={`${selected.firstName} ${selected.lastName}`} />
                    {selected.phone && <InfoRow icon={<Phone size={14} strokeWidth={1.75} />} label="Téléphone" value={selected.phone} />}
                    <InfoRow icon={<MapPin size={14} strokeWidth={1.75} />} label="Localisation"
                      value={[selected.region, selected.country].filter(Boolean).join(', ')} />
                    <InfoRow icon={<Clock size={14} strokeWidth={1.75} />} label="Inscrit le"
                      value={new Date(selected.createdAt).toLocaleDateString('fr-FR')} />
                  </div>
                </section>

                {/* Infos boutique */}
                <section>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--nafa-gray-400)' }}>Boutique</p>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoRow icon={<Store size={14} strokeWidth={1.75} />} label="Type"
                      value={selected.shopType === 'physical' ? 'Physique' : 'En ligne'} />
                    {selected.shopAddress && (
                      <InfoRow icon={<MapPin size={14} strokeWidth={1.75} />} label="Adresse" value={selected.shopAddress} />
                    )}
                    <InfoRow icon={<Star size={14} strokeWidth={1.75} />} label="Note" value={`${selected.rating.toFixed(1)} / 5`} />
                    <InfoRow icon={<span className="text-sm">📦</span>} label="Ventes totales" value={`${selected.totalSales} commandes`} />
                  </div>
                  {selected.shopDescription && (
                    <p className="text-sm mt-3 p-3 rounded-xl" style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}>
                      {selected.shopDescription}
                    </p>
                  )}
                </section>

                {/* CNIB */}
                <section>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--nafa-gray-400)' }}>
                    Pièce d'identité (CNIB)
                  </p>
                  {!selected.cnibUrl ? (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-yellow-50 text-yellow-700 text-sm">
                      <span>⚠️</span> Aucune CNIB soumise
                    </div>
                  ) : cnibLoading ? (
                    <Skeleton className="w-full h-48 rounded-xl" />
                  ) : cnibSignedUrl ? (
                    <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--nafa-gray-200)' }}>
                      <img src={cnibSignedUrl} alt="CNIB" className="w-full object-contain max-h-64" />
                      <div className="flex justify-end px-3 py-2" style={{ borderTop: '1px solid var(--nafa-gray-100)' }}>
                        <a href={cnibSignedUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--nafa-orange)' }}>
                          <ExternalLink size={12} strokeWidth={1.75} />
                          Ouvrir en plein écran
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm">
                      <span>⚠️</span> Impossible de charger la CNIB
                    </div>
                  )}
                </section>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  {!selected.isVerified && !selected.isSuspended && (
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => doAction(selected.id, 'certify')}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
                      style={{ background: 'var(--nafa-blue)', opacity: actionLoading ? 0.7 : 1 }}>
                      {actionLoading ? (
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      ) : (
                        <><ShieldCheck size={16} strokeWidth={1.75} />Certifier le compte</>
                      )}
                    </motion.button>
                  )}
                  {selected.isVerified && !selected.isSuspended && (
                    <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-green-50 text-green-700">
                      <BadgeCheck size={16} strokeWidth={1.75} />
                      Compte certifié
                    </div>
                  )}
                  {!selected.isSuspended ? (
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => doAction(selected.id, 'suspend')}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 bg-red-50"
                      style={{ opacity: actionLoading ? 0.7 : 1 }}>
                      <Ban size={15} strokeWidth={1.75} />
                      Suspendre
                    </motion.button>
                  ) : (
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => doAction(selected.id, 'reactivate')}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-green-700 bg-green-50"
                      style={{ opacity: actionLoading ? 0.7 : 1 }}>
                      <RefreshCw size={15} strokeWidth={1.75} />
                      Réactiver le compte
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--nafa-gray-400)' }}>{icon}</span>
      <div>
        <p className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>{label}</p>
        <p className="text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>{value || '—'}</p>
      </div>
    </div>
  );
}
