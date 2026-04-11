'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

interface ReviewModalProps {
  orderId: string;
  vendorId: string;
  vendorName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function ReviewModal({ orderId, vendorId, vendorName, onClose, onSubmitted }: ReviewModalProps) {
  const user = useAuthStore((s) => s.user);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = rating > 0;

  async function handleSubmit() {
    if (!canSubmit || !user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (supabase as any)
        .from('reviews')
        .insert({
          from_user_id: user.uid,
          to_user_id: vendorId,
          order_id: orderId,
          rating,
          comment: comment.trim() || null,
          type: 'client_to_vendor',
        });
      if (err) throw err;
      onSubmitted();
    } catch {
      setError('Une erreur est survenue. Réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const LABELS = ['', 'Mauvais', 'Passable', 'Bien', 'Très bien', 'Excellent'];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}>
        <motion.div
          initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white overflow-hidden"
          style={{ maxHeight: '90dvh', overflowY: 'auto' }}>
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--nafa-gray-200)' }} />
          </div>

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--nafa-black)' }}>Laisser un avis</h3>
                <p className="text-sm mt-0.5" style={{ color: 'var(--nafa-gray-700)' }}>{vendorName}</p>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--nafa-gray-100)' }}>
                <X size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-700)' }} />
              </button>
            </div>

            {/* Stars */}
            <div className="flex flex-col items-center mb-6">
              <div className="flex gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button key={star} whileTap={{ scale: 0.85 }}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(star)}
                    aria-label={`${star} étoile${star > 1 ? 's' : ''}`}>
                    <Star
                      size={36}
                      strokeWidth={1.5}
                      className={(hover || rating) >= star ? 'fill-[var(--nafa-orange)] text-[var(--nafa-orange)]' : ''}
                      style={(hover || rating) >= star ? undefined : { color: 'var(--nafa-gray-300)' }}
                    />
                  </motion.button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                {(hover || rating) > 0 && (
                  <motion.p key={hover || rating}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-sm font-semibold" style={{ color: 'var(--nafa-orange)' }}>
                    {LABELS[hover || rating]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>
                Commentaire <span className="font-normal" style={{ color: 'var(--nafa-gray-400)' }}>(optionnel)</span>
              </label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez votre expérience avec cette boutique..."
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none transition-colors"
                style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)', color: 'var(--nafa-black)' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--nafa-orange)'; e.target.style.background = 'white'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--nafa-gray-200)'; e.target.style.background = 'var(--nafa-gray-100)'; }}
              />
              <p className="text-xs mt-1 text-right" style={{ color: 'var(--nafa-gray-400)' }}>
                {comment.length}/500
              </p>
            </div>

            {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}>
                Annuler
              </button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'var(--nafa-orange)', opacity: !canSubmit ? 0.5 : 1 }}>
                {isSubmitting
                  ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  : <><CheckCircle2 size={15} strokeWidth={1.75} />Publier</>}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
