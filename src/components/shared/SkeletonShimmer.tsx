import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  rounded?: boolean;
  circle?: boolean;
}

export function Skeleton({ className, rounded = true, circle = false }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton-shimmer',
        circle ? 'rounded-full' : rounded ? 'rounded-xl' : 'rounded',
        className
      )}
      role="status"
      aria-label="Chargement..."
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <Skeleton className="aspect-square w-full" rounded={false} />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
