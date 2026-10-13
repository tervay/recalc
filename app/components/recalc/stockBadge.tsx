import { Badge } from '~/components/ui/badge';
import { Skeleton } from '~/components/ui/skeleton';
import type { StockStatus } from '~/lib/stock';

const LABELS: Record<Exclude<StockStatus, 'unknown'>, string> = {
  'in-stock': 'In stock',
  backorder: 'Backorder',
  'out-of-stock': 'Out of stock',
};

const VARIANTS = {
  'in-stock': 'secondary',
  backorder: 'destructive',
  'out-of-stock': 'destructive',
} as const satisfies Record<Exclude<StockStatus, 'unknown'>, string>;

export function StockBadge({ status }: { status: StockStatus | undefined }) {
  if (status === undefined) {
    return (
      <Skeleton data-testid="stock-loading" className="h-5 w-16 rounded-full" />
    );
  }
  if (status === 'unknown') {
    return (
      <span aria-label="Stock unknown" className="text-muted-foreground">
        -
      </span>
    );
  }
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
