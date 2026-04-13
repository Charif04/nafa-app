'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Magic link: user enters their email, receives a one-click login link.
// No password, no external OAuth app, no configuration needed.
// Supabase sends the email automatically.

export function MagicLinkForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setIsLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          // After clicking the link, the user lands on /auth/callback
          // which reads their role and redirects to the right dashboard.
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (otpError) {
        setError('Impossible d\'envoyer le lien. Vérifiez l\'adresse et réessayez.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {sent ? (
        <motion.div key="sent"
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-3.5 rounded-xl"
          style={{ background: 'rgba(0,200,83,0.07)', border: '1px solid rgba(0,200,83,0.2)' }}>
          <CheckCircle2 size={16} strokeWidth={1.75} className="text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-700">Lien envoyé !</p>
            <p className="text-xs text-green-600 mt-0.5">
              Vérifiez votre boîte mail <strong>{email}</strong> et cliquez sur le lien.
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={handleSubmit} className="space-y-2"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail size={14} strokeWidth={1.75}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--nafa-gray-400)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none transition-colors"
                style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--nafa-orange)'; e.target.style.background = 'white'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--nafa-gray-200)'; e.target.style.background = 'var(--nafa-gray-100)'; }}
              />
            </div>
            <motion.button type="submit" disabled={isLoading} whileTap={{ scale: 0.97 }}
              className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'var(--nafa-orange)' }}>
              {isLoading
                ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : 'Envoyer'}
            </motion.button>
          </div>
          {error && (
            <p className="text-xs text-red-600 px-1" role="alert">{error}</p>
          )}
        </motion.form>
      )}
    </AnimatePresence>
  );
}
