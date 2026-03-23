import { cn } from '~/lib/utils';

interface PctSpanProps {
  pct: number;
  decimals?: number;
}

export default function PctSpan({ pct, decimals = 1 }: PctSpanProps) {
  return (
    <span
      className={cn(
        'ml-1.5 text-xs',
        pct < 0 ? 'text-green-600' : 'text-red-600',
      )}
    >
      {pct > 0 ? '+' : ''}
      {pct.toFixed(decimals)}%
    </span>
  );
}
