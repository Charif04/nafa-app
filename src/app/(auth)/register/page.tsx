'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Phone, Globe, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/shared/Logo';
import { GoogleButton } from '@/components/shared/GoogleButton';
import { cn } from '@/lib/utils';

const COUNTRIES = ['Burkina Faso', 'Côte d\'Ivoire', 'Mali', 'Sénégal', 'Niger', 'Togo', 'Bénin', 'Ghana', 'Guinée', 'Mauritanie', 'France', 'Belgique', 'Canada', 'États-Unis'];

const PHONE_PREFIXES = [
  { code: '+226', label: '+226 Burkina Faso' },
  { code: '+225', label: '+225 Côte d\'Ivoire' },
  { code: '+223', label: '+223 Mali' },
  { code: '+221', label: '+221 Sénégal' },
  { code: '+227', label: '+227 Niger' },
  { code: '+228', label: '+228 Togo' },
  { code: '+229', label: '+229 Bénin' },
  { code: '+233', label: '+233 Ghana' },
  { code: '+224', label: '+224 Guinée' },
  { code: '+33', label: '+33 France' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+226');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    country: '',
    city: '',
  });

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            role: 'client',
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            phone: `${phonePrefix}${form.phone.trim()}`,
            country: form.country || 'Burkina Faso',
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
          setError('Cet email est déjà utilisé.');
        } else if (signUpError.message.includes('password')) {
          setError('Le mot de passe doit contenir au moins 6 caractères.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      router.replace('/home');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('fetch') || msg === '') {
        setError('Impossible de contacter le serveur. Vérifiez votre connexion.');
      } else {
        setError(msg || 'Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl" style={{ boxShadow: 'var(--shadow-xl)' }}>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--nafa-black)' }}>
            Créer un compte
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--nafa-gray-700)' }}>
            Rejoignez NAFA et découvrez des milliers de produits
          </p>

          {/* Google OAuth */}
          <div className="mb-5">
            <GoogleButton label="S'inscrire avec Google" />
            <div className="flex items-center gap-3 mt-5">
              <div className="flex-1 h-px" style={{ background: 'var(--nafa-gray-200)' }} />
              <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>ou avec un email</span>
              <div className="flex-1 h-px" style={{ background: 'var(--nafa-gray-200)' }} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Prénom" required>
                <input type="text" required value={form.firstName} onChange={(e) => updateForm('firstName', e.target.value)}
                  placeholder="Amadou" className={inputClass} autoComplete="given-name"
                  onFocus={onFocusInput} onBlur={onBlurInput} />
              </FormField>
              <FormField label="Nom" required>
                <input type="text" required value={form.lastName} onChange={(e) => updateForm('lastName', e.target.value)}
                  placeholder="Diallo" className={inputClass} autoComplete="family-name"
                  onFocus={onFocusInput} onBlur={onBlurInput} />
              </FormField>
            </div>

            <FormField label="Email" required>
              <div className="relative">
                <Mail size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }} />
                <input type="email" required value={form.email} onChange={(e) => updateForm('email', e.target.value)}
                  placeholder="vous@exemple.com" className={cn(inputClass, 'pl-9')} autoComplete="email"
                  onFocus={onFocusInput} onBlur={onBlurInput} />
              </div>
            </FormField>

            <FormField label="Téléphone" required>
              <div className="flex gap-2">
                <select
                  value={phonePrefix}
                  onChange={(e) => setPhonePrefix(e.target.value)}
                  className={cn(inputClass, 'w-auto flex-shrink-0 appearance-none pr-2')}
                  style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
                  aria-label="Indicatif pays"
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                >
                  {PHONE_PREFIXES.map((p) => (
                    <option key={p.code} value={p.code}>{p.label}</option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }} />
                  <input type="tel" required value={form.phone} onChange={(e) => updateForm('phone', e.target.value)}
                    placeholder="70 00 00 00" className={cn(inputClass, 'pl-9')} autoComplete="tel"
                    onFocus={onFocusInput} onBlur={onBlurInput} />
                </div>
              </div>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Pays" required>
                <div className="relative">
                  <Globe size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 z-10" style={{ color: 'var(--nafa-gray-400)' }} />
                  <select required value={form.country} onChange={(e) => updateForm('country', e.target.value)}
                    className={cn(inputClass, 'pl-9 appearance-none')}
                    onFocus={onFocusInput} onBlur={onBlurInput}
                  >
                    <option value="">Pays</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </FormField>
              <FormField label="Ville" required>
                <input type="text" required value={form.city} onChange={(e) => updateForm('city', e.target.value)}
                  placeholder="Ouagadougou" className={inputClass}
                  onFocus={onFocusInput} onBlur={onBlurInput} />
              </FormField>
            </div>

            <FormField label="Mot de passe" required>
              <div className="relative">
                <Lock size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--nafa-gray-400)' }} />
                <input type={showPassword ? 'text' : 'password'} required minLength={6}
                  value={form.password} onChange={(e) => updateForm('password', e.target.value)}
                  placeholder="••••••••" className={cn(inputClass, 'pl-9 pr-10')} autoComplete="new-password"
                  onFocus={onFocusInput} onBlur={onBlurInput} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}>
                  {showPassword
                    ? <EyeOff size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                    : <Eye size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />
                  }
                </button>
              </div>
            </FormField>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-red-600 text-center py-2 px-3 rounded-xl bg-red-50"
                  role="alert"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 mt-2"
              style={{ background: 'var(--nafa-orange)' }}
            >
              {isLoading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  Créer mon compte
                  <ArrowRight size={16} strokeWidth={1.75} />
                </>
              )}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--nafa-gray-700)' }}>
          Déjà un compte ?{' '}
          <Link href="/login" className="font-semibold" style={{ color: 'var(--nafa-orange)' }}>
            Se connecter
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

// Helper components
const inputClass = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors';
const onFocusInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = 'var(--nafa-orange)';
  e.target.style.background = 'white';
};
const onBlurInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = 'var(--nafa-gray-200)';
  e.target.style.background = 'var(--nafa-gray-100)';
};

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--nafa-gray-900)' }}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
