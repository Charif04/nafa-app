import { AlertTriangle, XCircle, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AlertSeverity, AlertType } from '@/types';

interface SeverityIndicatorProps {
  severity: AlertSeverity;
  type?: AlertType;
  size?: number;
  className?: string;
}

export function SeverityIndicator({ severity, type, size = 18, className }: SeverityIndicatorProps) {
  const iconClass = severity === 'critical' ? 'text-red-500' : 'text-orange-500';
  const iconProps = { size, strokeWidth: 1.75, className: iconClass };

  const icon =
    type === 'payment_failed' ? <XCircle {...iconProps} /> :
    type === 'high_cancellation' ? <AlertOctagon {...iconProps} /> :
    type === 'delivery_late' ? <AlertTriangle {...iconProps} /> :
    severity === 'critical' ? <XCircle {...iconProps} /> :
    <AlertTriangle {...iconProps} />;

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'w-2.5 h-2.5 rounded-full flex-shrink-0',
          severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'
        )}
      />
      {icon}
    </div>
  );
}
