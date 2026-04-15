'use client';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Upload, X, Plus, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { uploadProductImages } from '@/lib/api/storage';

const CATEGORIES = ['Mode', 'Électronique', 'Maison', 'Beauté', 'Sport', 'Alimentation', 'Artisanat', 'Bijoux', 'Autre'];

export default function NewProductPage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', price: '', stock: '', category: '', estimatedDelivery: '',
  });

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const oversized = selected.filter((f) => f.size > 8 * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`${oversized.length} fichier(s) dépasse(nt) 8 Mo et seront ignorés.`);
    }
    const valid = selected.filter((f) => f.size <= 8 * 1024 * 1024);
    valid.forEach((file) => {
      setPreviews((p) => [...p, URL.createObjectURL(file)]);
    });
    setFiles((prev) => [...prev, ...valid]);
    e.target.value = '';
  };

  const removeImage = (i: number) => {
    setPreviews((p) => p.filter((_, idx) => idx !== i));
    setFiles((f) => f.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!currentUser?.uid) throw new Error('Non authentifié');

      // Upload images sequentially to avoid rate-limit hangs
      const imageUrls: string[] = [];
      for (const file of files) {
        const url = await uploadProductImages(currentUser.uid, [file]);
        imageUrls.push(...url);
      }

      // Insert product in DB
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dbError } = await (supabase as any)
        .from('products')
        .insert({
          vendor_id: currentUser.uid,
          title: form.title.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          stock: Number(form.stock),
          category: form.category || null,
          images: imageUrls,
          currency: 'FCFA',
          is_active: true,
        });

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

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'var(--nafa-gray-100)' }} aria-label="Retour">
          <ChevronLeft size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-black)' }} />
        </button>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--nafa-black)' }}>Nouveau produit</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium mb-3" style={{ color: 'var(--nafa-gray-900)' }}>
            Photos du produit <span className="text-xs font-normal" style={{ color: 'var(--nafa-gray-400)' }}>(max 8 Mo par photo)</span>
          </label>
          <div className="flex gap-3 flex-wrap">
            {previews.map((url, i) => (
              <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                <img src={url} alt={`Aperçu ${i + 1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                  aria-label="Supprimer">
                  <X size={10} strokeWidth={2} className="text-white" />
                </button>
              </div>
            ))}
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

          <Field label="Délai d'envoi vers l'entrepôt">
            <input type="text" value={form.estimatedDelivery} onChange={(e) => update('estimatedDelivery', e.target.value)}
              placeholder="Ex: 24-48h" className={inputClass}
              style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
              onFocus={focusIn} onBlur={focusOut} />
          </Field>
        </div>

        {/* Error */}
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
              Publication en cours...
            </>
          ) : (
            <><Plus size={18} strokeWidth={1.75} />Publier le produit</>
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
