'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Fetch role to redirect to the right portal
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const role = (profile as any)?.role ?? 'client';
        const dest = role === 'admin'
          ? '/admin/dashboard'
          : role === 'vendor'
          ? '/vendor/dashboard'
          : '/home';

        timer = setTimeout(() => router.replace(dest), 2400);
      } else {
        // Not logged in — show the full splash animation then go to login
        timer = setTimeout(() => router.replace('/login'), 2400);
      }
    });

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: 'var(--nafa-white)' }}
    >
      {/* Logo animation */}
      <motion.div
        className="flex flex-col items-center gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated logo mark */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
          className="relative"
        >
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--nafa-orange) 0%, var(--nafa-orange-dark) 100%)' }}
          >
            <span className="text-white font-black text-4xl tracking-tight">N</span>
          </div>
        </motion.div>

        {/* Brand name */}
        <div className="flex items-end gap-0">
          {['N', 'A', 'F', 'A'].map((letter, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3 + i * 0.09,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-5xl font-black"
              style={{
                color: i % 2 === 0 ? 'var(--nafa-orange)' : 'var(--nafa-black)',
                letterSpacing: '0.06em',
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            >
              {letter}
            </motion.span>
          ))}
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="text-sm text-center max-w-xs"
          style={{ color: 'var(--nafa-gray-700)' }}
        >
          La marketplace africaine qui vous connecte
        </motion.p>


      </motion.div>

      {/* Loader dots */}
      <motion.div
        className="fixed bottom-16 flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--nafa-orange)' }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
