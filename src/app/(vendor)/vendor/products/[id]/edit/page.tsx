'use client';
import { useState, useRef, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Upload, X, Save, AlertCircle, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { uploadProductImages } from '@/lib/api/storage';

const CATEGORIES = ['Mode', 'Électronique', 'Maison', 'Beauté', 'Sport', 'Alimentation', 'Artisanat', 'Bijoux', 'Autre'];

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const fileRef = useRef<HTMLInputElement>(null);

  // Existing images already uploaded (URLs)
  const [existingImages, setExistingImages] = useState<string[]>([]);
  // New files added by user
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', price: '', stock: '', category: '', estimatedDelivery: '',
  });

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: err } = await (supabase as any)
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (err || !data) {
        setError('Produit introuvable.');
        setIsLoadingProduct(false);
        return;
      }

      setForm({
        title: data.title ?? '',
        description: data.description ?? '',
        price: String(data.price ?? ''),
        stock: String(data.stock ?? ''),
        category: data.category ?? '',
        estimatedDelivery: '',
      });
      setExistingImages(data.images ?? []);
      setIsLoadingProduct(false);
    }
    load();
  }, [id]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const oversized = selected.filter((f) => f.size > 8 * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`${oversized.length} fichier(s) dépasse(nt) 8 Mo et seront ignorés.`);
    }
    const valid = selected.filter((f) => f.size <= 8 * 1024 * 1024);
    valid.forEach((file) => setNewPreviews((p) => [...p, URL.createObjectURL(file)]));
    setNewFiles((prev) => [...prev, ...valid]);
    e.target.value = '';
  };

  const removeExisting = (i: number) => setExistingImages((p) => p.filter((_, idx) => idx !== i));
  const removeNew = (i: number) => {
    setNewPreviews((p) => p.filter((_, idx) => idx !== i));
    setNewFiles((f) => f.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!currentUser?.uid) throw new Error('Non authentifié');

      // Upload new images sequentially
      const uploadedUrls: string[] = [];
      for (const file of newFiles) {
        const urls = await uploadProductImages(currentUser.uid, [file]);
        uploadedUrls.push(...urls);
      }

      const allImages = [...existingImages, ...uploadedUrls];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dbError } = await (supabase as any)
        .from('products')
        .update({
          title: form.title.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          stock: Number(form.stock),
          category: form.category || null,
          images: allImages,
        })
        .eq('id', id);

      if (dbError) throw dbError;

      router.push('/vendor/products');
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : (err as { message?: string })?.message ?? 'Une erreur est survenue.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors';
  const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--nafa-orange)';
    e.target.style.background = 'white';
  };
  const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--nafa-gray-200)';
    e.target.style.background = 'var(--nafa-gray-100)';
  };

  if (isLoadingProduct) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
          <div className="h-7 w-48 rounded-lg animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'var(--nafa-gray-200)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'var(--nafa-gray-100)' }} aria-label="Retour">
          <ChevronLeft size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-black)' }} />
        </button>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--nafa-black)' }}>Modifier le produit</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <div>
          <label className="block text-sm font-medium mb-3" style={{ color: 'var(--nafa-gray-900)' }}>
            Photos du produit <span className="text-xs font-normal" style={{ color: 'var(--nafa-gray-400)' }}>(max 8 Mo par photo)</span>
          </label>
          <div className="flex gap-3 flex-wrap">
            {/* Existing images */}
            {existingImages.map((url, i) => (
              <div key={`ex-${i}`} className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeExisting(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                  aria-label="Supprimer">
                  <X size={10} strokeWidth={2} className="text-white" />
                </button>
              </div>
            ))}
            {/* New previews */}
            {newPreviews.map((url, i) => (
              <div key={`new-${i}`} className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0"
                style={{ outline: '2px solid var(--nafa-orange)' }}>
                <img src={url} alt={`Nouvelle photo ${i + 1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeNew(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                  aria-label="Supprimer">
                  <X size={10} strokeWidth={2} className="text-white" />
                </button>
              </div>
            ))}
            {/* Empty state */}
            {existingImages.length === 0 && newPreviews.length === 0 && (
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--nafa-gray-100)' }}>
                <Package size={24} style={{ color: 'var(--nafa-gray-400)' }} />
              </div>
            )}
            {/* Add button */}
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => fileRef.current?.click()}
              className="w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 flex-shrink-0 transition-colors"
              style={{ borderColor: 'var(--nafa-gray-200)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--nafa-orange)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--nafa-gray-200)'; }}>
              <Upload size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
              <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>Ajouter</span>
            </motion.button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={handleFiles} aria-label="Sélectionner des images" />
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <Field label="Titre du produit" required>
            <input type="text" required value={form.title} onChange={(e) => update('title', e.target.value)}
              placeholder="Ex: Boubou brodé traditionnel" className={inputClass}
              style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
              onFocus={focusIn} onBlur={focusOut} />
          </Field>

          <Field label="Description" required>
            <textarea required rows={4} value={form.description} onChange={(e) => update('description', e.target.value)}
              placeholder="Décrivez votre produit en détail..."
              className={inputClass + ' resize-none'}
              style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
              onFocus={focusIn} onBlur={focusOut} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Votre prix de vente (FCFA)" required>
              <input type="number" required min="1" value={form.price} onChange={(e) => update('price', e.target.value)}
                placeholder="12000" className={inputClass + ' nafa-mono'}
                style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
                onFocus={focusIn} onBlur={focusOut} />
              {form.price && Number(form.price) > 0 && (
                <p className="text-xs mt-1.5 nafa-mono" style={{ color: 'var(--nafa-gray-400)' }}>
                  Prix client : <span className="font-semibold" style={{ color: 'var(--nafa-orange)' }}>
                    {Math.round(Number(form.price) * 1.1).toLocaleString('fr-FR')} FCFA
                  </span> (+10% NAFA)
                </p>
              )}
            </Field>
            <Field label="Stock" required>
              <input type="number" required min="0" value={form.stock} onChange={(e) => update('stock', e.target.value)}
                placeholder="10" className={inputClass + ' nafa-mono'}
                style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
                onFocus={focusIn} onBlur={focusOut} />
            </Field>
          </div>

          <Field label="Catégorie" required>
            <select required value={form.category} onChange={(e) => update('category', e.target.value)}
              className={inputClass + ' appearance-none'}
              style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
              onFocus={focusIn} onBlur={focusOut}>
              <option value="">Sélectionner une catégorie</option>
              {CATEGORIES.map((c) => <option key={c} value={c.toLowerCase()}>{c}</option>)}
            </select>
          </Field>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600">
            <AlertCircle size={14} strokeWidth={1.75} />
            {error}
          </div>
        )}

        <motion.button type="submit" disabled={isLoading} whileTap={{ scale: 0.98 }}
          className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
          style={{ background: 'var(--nafa-orange)', opacity: isLoading ? 0.7 : 1 }}>
          {isLoading ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Enregistrement...
            </>
          ) : (
            <><Save size={18} strokeWidth={1.75} />Enregistrer les modifications</>
          )}
        </motion.button>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
