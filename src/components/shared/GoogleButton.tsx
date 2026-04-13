'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface Props {
  label?: string;
}

export function GoogleButton({ label = 'Continuer avec Google' }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setError('');
    setIsLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            // Request full profile so we get first_name, last_name, avatar
            access_type: 'online',
            prompt: 'select_account',
          },
        },
      });
      if (oauthError) {
        setError('Impossible de se connecter avec Google. Réessayez.');
        setIsLoading(false);
      }
      // On success: browser redirects to Google — no need to reset isLoading
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border text-sm font-medium transition-colors disabled:opacity-60"
        style={{
          borderColor: 'var(--nafa-gray-200)',
          background: 'white',
          color: 'var(--nafa-gray-900)',
        }}
      >
        {isLoading ? (
          <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--nafa-gray-400)', borderTopColor: 'transparent' }} />
        ) : (
          /* Google "G" logo */
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
        )}
        {label}
      </motion.button>
      {error && (
        <p className="text-xs text-red-600 text-center mt-2" role="alert">{error}</p>
      )}
    </div>
  );
}
