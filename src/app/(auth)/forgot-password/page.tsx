'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/shared/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setIsLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      if (resetError) {
        setError('Impossible d\'envoyer l\'email. Vérifiez l\'adresse et réessayez.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion et réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="flex justify-center mb-10">
          <Logo size="lg" animated />
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl" style={{ boxShadow: 'var(--shadow-xl)' }}>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm mb-6"
            style={{ color: 'var(--nafa-gray-400)' }}>
            <ArrowLeft size={14} strokeWidth={1.75} />
            Retour à la connexion
          </Link>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle2 size={32} strokeWidth={1.5} className="text-green-500" />
                </div>
                <div>
                  <p className="text-base font-bold mb-1" style={{ color: 'var(--nafa-black)' }}>Email envoyé !</p>
                  <p className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>
                    Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.<br />
                    Vérifiez votre boîte mail (et les spams).
                  </p>
                </div>
                <Link href="/login" className="text-sm font-semibold mt-2" style={{ color: 'var(--nafa-orange)' }}>
                  Retour à la connexion
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--nafa-black)' }}>
                  Mot de passe oublié ?
                </h1>
                <p className="text-sm mb-6" style={{ color: 'var(--nafa-gray-700)' }}>
                  Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1.5"
                      style={{ color: 'var(--nafa-gray-900)' }}>
                      Email
                    </label>
                    <div className="relative">
                      <Mail size={16} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--nafa-gray-400)' }} />
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vous@exemple.com"
                        autoComplete="email"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors"
                        style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
                        onFocus={(e) => { e.target.style.borderColor = 'var(--nafa-orange)'; e.target.style.background = 'white'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'var(--nafa-gray-200)'; e.target.style.background = 'var(--nafa-gray-100)'; }}
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-red-600 text-center py-2 px-3 rounded-xl bg-red-50" role="alert">
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.button type="submit" disabled={isLoading} whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                    style={{ background: 'var(--nafa-orange)' }}>
                    {isLoading
                      ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      : 'Envoyer le lien'}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
