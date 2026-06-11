import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  count?: number;
  readOnly?: boolean;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export default function StarRating({
  value,
  count = 5,
  readOnly = false,
  onChange,
  size = 'md',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number>(0);

  const displayValue = hoverValue || value;

  const handleClick = (index: number) => {
    if (readOnly || !onChange) return;
    onChange(index);
  };

  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: count }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => handleClick(star)}
          onMouseEnter={() => !readOnly && setHoverValue(star)}
          onMouseLeave={() => !readOnly && setHoverValue(0)}
          className={cn(
            'transition-colors',
            readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          )}
        >
          <Star
            className={cn(
              sizeMap[size],
              star <= displayValue
                ? 'text-neon-cyan fill-neon-cyan/60 drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]'
                : 'text-slate-600'
            )}
          />
        </button>
      ))}
    </div>
  );
}
