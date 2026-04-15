'use client';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOrderStatusLabel } from '@/lib/utils';
import type { OrderStatus, StatusHistoryEntry } from '@/types';

const ORDER_STEPS: OrderStatus[] = [
  'placed',
  'confirmed',
  'preparing',
  'in_transit_warehouse',
  'at_warehouse',
  'delivering',
  'delivered',
];

interface OrderStatusStepperProps {
  currentStatus: OrderStatus;
  statusHistory?: StatusHistoryEntry[];
  className?: string;
}

function getStepState(step: OrderStatus, currentStatus: OrderStatus): 'completed' | 'current' | 'pending' {
  if (currentStatus === 'cancelled') return 'pending';
  const currentIndex = ORDER_STEPS.indexOf(currentStatus);
  const stepIndex = ORDER_STEPS.indexOf(step);
  if (stepIndex < currentIndex) return 'completed';
  // Terminal state: the final step (delivered) is fully completed, not "in progress"
  if (stepIndex === currentIndex && currentStatus === 'delivered') return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'pending';
}

export function OrderStatusStepper({ currentStatus, statusHistory, className }: OrderStatusStepperProps) {
  if (currentStatus === 'cancelled') {
    return (
      <div className={cn('flex flex-col items-center py-8', className)}>
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
        </div>
        <p className="text-sm font-medium text-red-600">Commande annulée</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {ORDER_STEPS.map((step, index) => {
        const state = getStepState(step, currentStatus);
        const historyEntry = statusHistory?.find((h) => h.status === step);
        const isLast = index === ORDER_STEPS.length - 1;

        return (
          <div key={step} className="flex gap-4">
            {/* Left column: icon + line */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex-shrink-0 mt-0.5"
              >
                {state === 'completed' ? (
                  <CheckCircle2
                    size={22}
                    strokeWidth={1.75}
                    className="text-green-500"
                  />
                ) : state === 'current' ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="relative"
                  >
                    <div
                      className="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: 'var(--nafa-orange)' }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: 'var(--nafa-orange)' }}
                      />
                    </div>
                    {/* Pulse halo */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: '2px solid var(--nafa-orange)' }}
                      animate={{ scale: [1, 1.6, 1.6], opacity: [0.8, 0, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  </motion.div>
                ) : (
                  <Circle
                    size={22}
                    strokeWidth={1.75}
                    style={{ color: 'var(--nafa-gray-400)' }}
                  />
                )}
              </motion.div>

              {/* Connecting line */}
              {!isLast && (
                <div className="w-0.5 flex-1 my-1 overflow-hidden rounded-full" style={{ background: 'var(--nafa-gray-200)', minHeight: 24 }}>
                  {state === 'completed' && (
                    <motion.div
                      className="w-full bg-green-500"
                      initial={{ height: 0 }}
                      animate={{ height: '100%' }}
                      transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.1 }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Right column: text */}
            <div className={cn('pb-6', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-medium',
                  state === 'completed' ? 'text-green-700' :
                  state === 'current' ? 'font-semibold' : ''
                )}
                style={state === 'current' ? { color: 'var(--nafa-orange)' } :
                       state === 'pending' ? { color: 'var(--nafa-gray-400)' } : undefined}
              >
                {getOrderStatusLabel(step)}
              </p>
              {historyEntry && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }}>
                  {new Date(historyEntry.timestamp).toLocaleString('fr-FR')}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
