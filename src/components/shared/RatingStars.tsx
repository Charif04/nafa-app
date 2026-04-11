'use client';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  className?: string;
}

export function RatingStars({
  rating,
  max = 5,
  size = 14,
  showValue = false,
  reviewCount,
  interactive = false,
  onRate,
  className,
}: RatingStarsProps) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(star)}
            className={cn(
              'transition-transform',
              interactive && 'cursor-pointer hover:scale-110 active:scale-95',
              !interactive && 'cursor-default'
            )}
            aria-label={interactive ? `Donner ${star} étoile${star > 1 ? 's' : ''}` : undefined}
          >
            <Star
              size={size}
              strokeWidth={1.75}
              className={cn(
                star <= Math.round(rating)
                  ? 'fill-[var(--nafa-orange)] text-[var(--nafa-orange)]'
                  : 'fill-transparent text-[var(--nafa-gray-400)]'
              )}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-medium" style={{ color: 'var(--nafa-gray-700)' }}>
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-xs" style={{ color: 'var(--nafa-gray-400)' }}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
