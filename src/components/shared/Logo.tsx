'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}

export function Logo({ size = 'md', className, animated = false }: LogoProps) {
  const sizes = { sm: 'text-xl', md: 'text-2xl', lg: 'text-4xl' };

  const letters = ['N', 'A', 'F', 'A'];

  if (animated) {
    return (
      <div className={cn('flex items-center gap-0', sizes[size], className)}>
        {letters.map((letter, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="font-black tracking-tight"
            style={{ color: i % 2 === 0 ? 'var(--nafa-orange)' : 'var(--nafa-black)' }}
          >
            {letter}
          </motion.span>
        ))}
        <motion.span
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="ml-1 text-xs font-medium tracking-widest uppercase"
          style={{ color: 'var(--nafa-gray-700)', alignSelf: 'flex-end', marginBottom: 2 }}
        >
          market
        </motion.span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-0', sizes[size], className)}>
      <span className="font-black tracking-tight" style={{ color: 'var(--nafa-orange)' }}>N</span>
      <span className="font-black tracking-tight" style={{ color: 'var(--nafa-black)' }}>A</span>
      <span className="font-black tracking-tight" style={{ color: 'var(--nafa-orange)' }}>F</span>
      <span className="font-black tracking-tight" style={{ color: 'var(--nafa-black)' }}>A</span>
      <span className="ml-1 text-xs font-medium tracking-widest uppercase" style={{ color: 'var(--nafa-gray-700)', alignSelf: 'flex-end', marginBottom: 2 }}>market</span>
    </div>
  );
}
