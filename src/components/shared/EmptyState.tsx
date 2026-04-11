'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex flex-col items-center justify-center py-16 px-8 text-center', className)}
    >
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: 'var(--nafa-gray-100)' }}
      >
        <Icon size={36} strokeWidth={1.5} style={{ color: 'var(--nafa-gray-400)' }} />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--nafa-gray-900)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm max-w-xs mb-6" style={{ color: 'var(--nafa-gray-700)' }}>
          {description}
        </p>
      )}
      {action && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02, translateY: -1 }}
          onClick={action.onClick}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: 'var(--nafa-orange)' }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
