'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/shared/Logo';

type Status = 'loading' | 'ready' | 'expired' | 'success';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Supabase v2 PKCE: the reset email link contains ?code=xxx
    // We must explicitly exchange it for a session.
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.auth as any).exchangeCodeForSession(code)
        .then(({ error: exchangeError }: { error: Error | null }) => {
          if (exchangeError) {
            setStatus('expired');
          } else {
            setStatus('ready');
          }
        });
      return;
    }

    // Fallback: listen for PASSWORD_RECOVERY event (old email flow / magic link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setStatus('ready');
      }
    });

    // Also check if a valid session is already active
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStatus('ready');
      else {
        // No code, no session → link is missing or expired
        setTimeout(() => {
          setStatus((prev) => prev === 'loading' ? 'expired' : prev);
        }, 3000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const withTimeout = <T,>(p: Promise<T>, ms = 15000): Promise<T> =>
    Promise.race([p, new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Délai dépassé. Vérifiez votre connexion et réessayez.')), ms))]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      // Verify session is still active before attempting update
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus('expired');
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await withTimeout((supabase as any).auth.updateUser({ password: newPassword }));
      if (updateError) {
        setError(updateError.message ?? 'Impossible de mettre à jour le mot de passe.');
      } else {
        setStatus('success');
        setTimeout(() => router.replace('/home'), 2500);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg || 'Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = 'w-full pl-10 pr-10 py-3 rounded-xl border text-sm outline-none transition-colors';
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'var(--nafa-orange)'; e.target.style.background = 'white'; };
  const onBlurStyle = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'var(--nafa-gray-200)'; e.target.style.background = 'var(--nafa-gray-100)'; };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-sm">

        <div className="flex justify-center mb-10">
          <Logo size="lg" animated />
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl" style={{ boxShadow: 'var(--shadow-xl)' }}>
          <AnimatePresence mode="wait">

            {/* Loading */}
            {status === 'loading' && (
              <motion.div key="loading" className="flex flex-col items-center gap-4 py-8">
                <div className="w-8 h-8 rounded-full border-[3px] border-t-transparent animate-spin"
                  style={{ borderColor: 'var(--nafa-orange)', borderTopColor: 'transparent' }} />
                <p className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>Vérification du lien…</p>
              </motion.div>
            )}

            {/* Expired / invalid link */}
            {status === 'expired' && (
              <motion.div key="expired" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={28} strokeWidth={1.5} className="text-red-500" />
                </div>
                <div>
                  <p className="text-base font-bold mb-1" style={{ color: 'var(--nafa-black)' }}>
                    Lien expiré ou invalide
                  </p>
                  <p className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>
                    Ce lien n&apos;est valable qu&apos;une seule fois et expire après 1 heure.
                  </p>
                </div>
                <Link href="/forgot-password"
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white text-center"
                  style={{ background: 'var(--nafa-orange)' }}>
                  Demander un nouveau lien
                </Link>
              </motion.div>
            )}

            {/* Success */}
            {status === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle2 size={32} strokeWidth={1.5} className="text-green-500" />
                </div>
                <div>
                  <p className="text-base font-bold mb-1" style={{ color: 'var(--nafa-black)' }}>
                    Mot de passe mis à jour !
                  </p>
                  <p className="text-sm" style={{ color: 'var(--nafa-gray-700)' }}>
                    Redirection en cours…
                  </p>
                </div>
              </motion.div>
            )}

            {/* Form */}
            {status === 'ready' && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--nafa-black)' }}>
                  Nouveau mot de passe
                </h1>
                <p className="text-sm mb-6" style={{ color: 'var(--nafa-gray-700)' }}>
                  Choisissez un mot de passe sécurisé d&apos;au moins 6 caractères.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <Lock size={16} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--nafa-gray-400)' }} />
                      <input type={showNew ? 'text' : 'password'} required value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••"
                        className={inputClass} autoComplete="new-password"
                        style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
                        onFocus={onFocus} onBlur={onBlurStyle} />
                      <button type="button" onClick={() => setShowNew(!showNew)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        {showNew
                          ? <EyeOff size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                          : <Eye size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>
                      Confirmer
                    </label>
                    <div className="relative">
                      <Lock size={16} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--nafa-gray-400)' }} />
                      <input type={showConfirm ? 'text' : 'password'} required value={confirm}
                        onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••"
                        className={inputClass} autoComplete="new-password"
                        style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
                        onFocus={onFocus} onBlur={onBlurStyle} />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        {showConfirm
                          ? <EyeOff size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                          : <Eye size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />}
                      </button>
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
                      : 'Enregistrer le mot de passe'}
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
