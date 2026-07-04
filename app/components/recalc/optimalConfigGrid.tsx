import { useState } from 'react';
import TrendingUpIcon from '~icons/lucide/trending-up';

import { Loader } from '~/components/shadix-ui/components/loader';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Skeleton } from '~/components/ui/skeleton';
import { Switch } from '~/components/ui/switch';
import type {
  ConfigOptOutput,
  ConfigOptResult,
} from '~/lib/math/optimizerUtils';
import { cn } from '~/lib/utils';

interface OptimalConfigGridProps {
  configOptResult: ConfigOptOutput | null;
  userStatorAmps: number;
  userSupplyAmps: number;
  selectedCell: ConfigOptResult | null;
  onSelectCell: (cell: ConfigOptResult | null) => void;
}

function getTimeBgClass(normalized: number): string {
  if (normalized < 0.2) return 'bg-primary text-primary-foreground';
  if (normalized < 0.4) return 'bg-primary/70 text-primary-foreground';
  if (normalized < 0.6) return 'bg-primary/40 text-foreground';
  if (normalized < 0.8) return 'bg-primary/20 text-foreground';
  return 'bg-muted text-muted-foreground';
}

interface GridCellProps {
  cell: ConfigOptResult;
  isSelected: boolean;
  isRecommended: boolean;
  expanded: boolean;
  normalizedTime: number;
  onSelect: () => void;
}

function GridCell({
  cell,
  isSelected,
  isRecommended,
  expanded,
  normalizedTime,
  onSelect,
}: GridCellProps) {
  const bgClass = getTimeBgClass(normalizedTime);
  const avgPower =
    cell.timeToGoalSeconds > 0 ? cell.energyJoules / cell.timeToGoalSeconds : 0;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full rounded-md border text-center transition-all duration-200',
        isSelected
          ? 'relative z-10 shadow-lg ring-2 ring-primary ring-offset-2 ring-offset-background'
          : isRecommended
            ? 'shadow-sm ring-1 ring-primary/50 ring-offset-1 ring-offset-background'
            : 'hover:shadow-sm hover:ring-1 hover:ring-primary/30',
        bgClass,
      )}
    >
      <div className={cn('p-2', expanded && 'pb-0')}>
        <div className="text-lg leading-tight font-bold tabular-nums">
          {cell.timeToGoalSeconds.toFixed(2)}s
        </div>
        <div className="text-[11px] tabular-nums opacity-80">
          {cell.optimalRatio.toFixed(2)}:1
        </div>
      </div>
      {expanded && (
        <div className="flex flex-col gap-0.5 px-2 pt-1 pb-2 text-[10px] tabular-nums opacity-80">
          <div>{cell.peakCurrentAmps.toFixed(1)}A peak</div>
          <div>{cell.energyJoules.toFixed(1)}J</div>
          <div>{avgPower.toFixed(1)}W avg</div>
        </div>
      )}
    </button>
  );
}

export function OptimalConfigGrid({
  configOptResult,
  userStatorAmps,
  userSupplyAmps,
  selectedCell,
  onSelectCell,
}: OptimalConfigGridProps) {
  const [expanded, setExpanded] = useState(false);

  if (!configOptResult) {
    const SKELETON_COLS = 6;
    const SKELETON_ROWS = 8;

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">
              Optimal Configuration Grid
            </h2>
            <p className="animate-pulse text-xs text-muted-foreground">
              Simulating configurations&hellip;
            </p>
          </div>
          <Badge variant="outline" className="gap-1 text-xs opacity-40">
            <TrendingUpIcon className="size-3" />
            &mdash; configs
          </Badge>
        </div>

        <Card className="overflow-hidden">
          <Loader variant="bar" className="h-1 w-full rounded-none" />
          <CardContent className="overflow-x-auto p-4">
            <div className="min-w-120">
              <div
                className="mb-2 grid gap-2"
                style={{
                  gridTemplateColumns: `80px repeat(${SKELETON_COLS}, 1fr)`,
                }}
              >
                <div className="pb-2" />
                {Array.from({ length: SKELETON_COLS }, (_, i) => (
                  <div key={i} className="pb-2 text-center">
                    <Skeleton className="mx-auto h-3 w-8" />
                    <Skeleton className="mx-auto mt-1 h-2 w-10" />
                  </div>
                ))}
              </div>
              {Array.from({ length: SKELETON_ROWS }, (_, r) => (
                <div
                  key={r}
                  className="mb-2 grid gap-2"
                  style={{
                    gridTemplateColumns: `80px repeat(${SKELETON_COLS}, 1fr)`,
                  }}
                >
                  <div className="flex items-center justify-center">
                    <Skeleton className="h-3 w-10" />
                  </div>
                  {Array.from({ length: SKELETON_COLS }, (_, c) => (
                    <Skeleton
                      key={c}
                      className="h-14 rounded-md"
                      style={{
                        animationDelay: `${(r * SKELETON_COLS + c) * 80}ms`,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!configOptResult.recommended) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            No successful configurations found. Try adjusting your inputs.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { allResults, recommended } = configOptResult;
  const successResults = allResults.filter((r) => r.success);

  const statorLimits = [
    ...new Set(allResults.map((r) => r.statorLimitAmps)),
  ].sort((a, b) => a - b);
  const supplyLimits = [
    ...new Set(allResults.map((r) => r.supplyLimitAmps)),
  ].sort((a, b) => a - b);

  const cellMap = new Map(
    allResults.map((r) => [`${r.statorLimitAmps}-${r.supplyLimitAmps}`, r]),
  );

  const times = successResults.map((r) => r.timeToGoalSeconds);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeRange = maxTime - minTime || 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Optimal Configuration Grid</h2>
          <p className="text-xs text-muted-foreground">
            Best gear ratio per current limit combination
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="expand-metrics"
              checked={expanded}
              onCheckedChange={setExpanded}
            />
            <Label
              htmlFor="expand-metrics"
              className="cursor-pointer text-xs text-muted-foreground"
            >
              All metrics
            </Label>
          </div>
          <Badge variant="outline" className="gap-1 text-xs">
            <TrendingUpIcon className="size-3" />
            {successResults.length} configs
          </Badge>
        </div>
      </div>

      {/* Grid */}
      <Card>
        <CardContent className="overflow-x-auto p-4">
          <div className="min-w-120">
            {/* Column headers – supply limits */}
            <div
              className="mb-2 grid gap-2"
              style={{
                gridTemplateColumns: `80px repeat(${supplyLimits.length}, 1fr)`,
              }}
            >
              <div className="flex items-end justify-center pb-2" />
              {supplyLimits.map((supply) => (
                <div key={supply} className="pb-2 text-center">
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      supply === userSupplyAmps
                        ? 'text-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    {supply}A
                  </span>
                  <p className="text-[10px] text-muted-foreground/70">Supply</p>
                </div>
              ))}
            </div>

            {/* Grid rows – stator limits */}
            {statorLimits.map((stator) => (
              <div
                key={stator}
                className="mb-2 grid gap-2"
                style={{
                  gridTemplateColumns: `80px repeat(${supplyLimits.length}, 1fr)`,
                }}
              >
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        stator === userStatorAmps
                          ? 'text-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      {stator}A
                    </span>
                    <p className="text-[10px] text-muted-foreground/70">
                      Stator
                    </p>
                  </div>
                </div>

                {supplyLimits.map((supply) => {
                  const cell = cellMap.get(`${stator}-${supply}`);
                  const isRecommended =
                    recommended.statorLimitAmps === stator &&
                    recommended.supplyLimitAmps === supply;

                  if (!cell?.success) {
                    return (
                      <div
                        key={supply}
                        className="flex items-center justify-center rounded-md border bg-muted/30 p-2"
                      >
                        <span className="text-sm text-muted-foreground">—</span>
                      </div>
                    );
                  }

                  const isSelected =
                    selectedCell?.statorLimitAmps === stator &&
                    selectedCell?.supplyLimitAmps === supply;

                  const normalizedTime =
                    (cell.timeToGoalSeconds - minTime) / timeRange;

                  return (
                    <GridCell
                      key={supply}
                      cell={cell}
                      isSelected={isSelected}
                      isRecommended={isRecommended}
                      expanded={expanded}
                      normalizedTime={normalizedTime}
                      onSelect={() => onSelectCell(isSelected ? null : cell)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
