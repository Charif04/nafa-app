'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/shared/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !data.user) {
      setError('Email ou mot de passe incorrect. Veuillez réessayer.');
      setIsLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single() as { data: { role: string } | null; error: unknown };

    const role = profileData?.role;

    if (role === 'admin') {
      router.replace('/admin/dashboard');
    } else if (role === 'vendor') {
      router.replace('/vendor/dashboard');
    } else {
      router.replace('/home');
    }
  };

  const inputBase = 'w-full py-3 rounded-xl border text-sm outline-none transition-colors';
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--nafa-orange)';
    e.target.style.background = 'white';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--nafa-gray-200)';
    e.target.style.background = 'var(--nafa-gray-100)';
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Logo size="lg" animated />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl" style={{ boxShadow: 'var(--shadow-xl)' }}>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--nafa-black)' }}>
            Bon retour
          </h1>
          <p className="text-sm mb-7" style={{ color: 'var(--nafa-gray-700)' }}>
            Connectez-vous à votre compte
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>
                Email
              </label>
              <div className="relative">
                <Mail size={16} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }} />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className={`${inputBase} pl-10 pr-4`}
                  style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nafa-gray-900)' }}>
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={16} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputBase} pl-10 pr-11`}
                  style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword
                    ? <EyeOff size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                    : <Eye size={16} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                  }
                </button>
              </div>
            </div>

            {/* Mot de passe oublié */}
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs font-medium" style={{ color: 'var(--nafa-orange)' }}>
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Erreur */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-red-600 text-center py-2 px-3 rounded-xl bg-red-50"
                  role="alert"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Bouton */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
              style={{ background: 'var(--nafa-orange)' }}
            >
              {isLoading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={16} strokeWidth={1.75} />
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Lien inscription */}
        <p className="text-center text-sm mt-6" style={{ color: 'var(--nafa-gray-700)' }}>
          Pas encore de compte ?{' '}
          <Link href="/register" className="font-semibold" style={{ color: 'var(--nafa-orange)' }}>
            S&apos;inscrire
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
