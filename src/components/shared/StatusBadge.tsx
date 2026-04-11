import { cn } from '@/lib/utils';
import { getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import type { OrderStatus } from '@/types';

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorMap: Record<OrderStatus, { bg: string; text: string; dot: string }> = {
    placed: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
    confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    preparing: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    in_transit_warehouse: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
    at_warehouse: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
    delivering: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
    delivered: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  };

  const colors = colorMap[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        colors.bg,
        colors.text,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', colors.dot)} />
      {getOrderStatusLabel(status)}
    </span>
  );
}
