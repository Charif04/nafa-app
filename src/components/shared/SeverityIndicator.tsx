import { AlertTriangle, XCircle, Info, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AlertSeverity, AlertType } from '@/types';

interface SeverityIndicatorProps {
  severity: AlertSeverity;
  type?: AlertType;
  size?: number;
  className?: string;
}

export function SeverityIndicator({ severity, type, size = 18, className }: SeverityIndicatorProps) {
  const getIcon = () => {
    if (type === 'payment_failed') return XCircle;
    if (type === 'high_cancellation') return AlertOctagon;
    if (type === 'delivery_late') return AlertTriangle;
    return severity === 'critical' ? XCircle : AlertTriangle;
  };

  const Icon = getIcon();

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'w-2.5 h-2.5 rounded-full flex-shrink-0',
          severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'
        )}
      />
      <Icon
        size={size}
        strokeWidth={1.75}
        className={severity === 'critical' ? 'text-red-500' : 'text-orange-500'}
      />
    </div>
  );
}
