'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/shared/Logo';
import { MagicLinkForm } from '@/components/shared/MagicLinkForm';

type Tab = 'password' | 'magic';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('password');
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

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-2xl mb-6" style={{ background: 'var(--nafa-gray-100)' }}>
            <button
              type="button"
              onClick={() => { setTab('password'); setError(''); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={tab === 'password'
                ? { background: 'white', color: 'var(--nafa-black)', boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }
                : { color: 'var(--nafa-gray-500)' }}
            >
              <Lock size={14} strokeWidth={2} />
              Mot de passe
            </button>
            <button
              type="button"
              onClick={() => { setTab('magic'); setError(''); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={tab === 'magic'
                ? { background: 'white', color: 'var(--nafa-black)', boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }
                : { color: 'var(--nafa-gray-500)' }}
            >
              <Zap size={14} strokeWidth={2} />
              Lien magique
            </button>
          </div>

          <AnimatePresence mode="wait">
            {tab === 'password' ? (
              <motion.div key="password" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
                <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--nafa-black)' }}>
                  Bon retour
                </h1>
                <p className="text-sm mb-6" style={{ color: 'var(--nafa-gray-700)' }}>
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
                        placeholder="vous@exemple.com"
                        className={`${inputBase} pl-10 pr-4`}
                        style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                    </div>
                  </div>

                  {/* Password */}
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

                  {/* Forgot password */}
                  <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-xs font-medium" style={{ color: 'var(--nafa-orange)' }}>
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  {/* Error */}
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

                  {/* Submit */}
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
              </motion.div>
            ) : (
              <motion.div key="magic" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18 }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,107,0,0.10)' }}>
                    <Zap size={20} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                  </div>
                  <div>
                    <p className="text-base font-bold" style={{ color: 'var(--nafa-black)' }}>Sans mot de passe</p>
                    <p className="text-xs" style={{ color: 'var(--nafa-gray-600)' }}>Recevez un lien de connexion par email</p>
                  </div>
                </div>

                <p className="text-sm mb-5" style={{ color: 'var(--nafa-gray-700)' }}>
                  Entrez votre adresse email et nous vous enverrons un lien pour vous connecter instantanément — aucun mot de passe requis.
                </p>

                <MagicLinkForm />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Register link */}
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
