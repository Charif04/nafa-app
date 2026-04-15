'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
  /** Override the link destination. Pass false to render without a link. */
  href?: string | false;
}

function useLogoHref(): string {
  const user = useAuthStore((s) => s.user);
  if (!user) return '/';
  if (user.role === 'admin') return '/admin/dashboard';
  if (user.role === 'vendor') return '/vendor/dashboard';
  return '/home';
}

const LETTER_COLORS = ['var(--nafa-orange)', 'var(--nafa-black)', 'var(--nafa-orange)', 'var(--nafa-black)'];

export function Logo({ size = 'md', className, animated = false, href }: LogoProps) {
  const autoHref = useLogoHref();
  const dest = href === false ? null : (href ?? autoHref);

  const sizeClass = {
    sm: 'text-[1.25rem]',
    md: 'text-[1.6rem]',
    lg: 'text-[2.8rem]',
  }[size];

  const letterSpacing = {
    sm: '0.04em',
    md: '0.05em',
    lg: '0.06em',
  }[size];

  const inner = animated ? (
    <div className={cn('inline-flex items-baseline gap-0', sizeClass, className)}>
      {['N', 'A', 'F', 'A'].map((letter, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.09, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          style={{
            color: LETTER_COLORS[i],
            fontWeight: 900,
            letterSpacing,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            lineHeight: 1,
          }}
        >
          {letter}
        </motion.span>
      ))}
    </div>
  ) : (
    <div className={cn('inline-flex items-baseline gap-0', sizeClass, className)}>
      {['N', 'A', 'F', 'A'].map((letter, i) => (
        <span
          key={i}
          style={{
            color: LETTER_COLORS[i],
            fontWeight: 900,
            letterSpacing,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            lineHeight: 1,
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );

  if (!dest) return inner;

  return (
    <Link href={dest} aria-label="Accueil NAFA">
      {inner}
    </Link>
  );
}
