import { Button } from '~/components/ui/button';
import type { ConfigOptResult } from '~/lib/math/optimizerUtils';

interface SelectedConfigProps {
  config: ConfigOptResult;
  onSetConfig: (config: ConfigOptResult) => void;
}

export function SelectedConfig({ config, onSetConfig }: SelectedConfigProps) {
  return (
    <section
      className="flex flex-col gap-3 rounded-lg border p-4"
      data-testid="selected-config"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <div className="size-1.5 rounded-full bg-primary" />
          Selected Config
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => onSetConfig(config)}
        >
          Set
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        <div>
          <p className="text-xs text-muted-foreground">Stator</p>
          <p
            className="text-sm font-semibold tabular-nums"
            data-testid="selected-config-stator"
          >
            {config.statorLimitAmps}A
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Supply</p>
          <p
            className="text-sm font-semibold tabular-nums"
            data-testid="selected-config-supply"
          >
            {config.supplyLimitAmps}A
          </p>
        </div>
        <div className="col-span-2">
          <div>
            <p className="text-xs text-muted-foreground">Optimal Ratio</p>
            <p
              className="text-sm font-semibold text-primary tabular-nums"
              data-testid="selected-config-ratio"
            >
              {config.optimalRatio.toFixed(2)}:1
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Time</p>
          <p className="text-sm font-semibold tabular-nums">
            {config.timeToGoalSeconds.toFixed(3)}s
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Peak Supply</p>
          <p className="text-sm font-semibold tabular-nums">
            {config.peakCurrentAmps.toFixed(1)}A
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Energy</p>
          <p className="text-sm font-semibold tabular-nums">
            {config.energyJoules.toFixed(1)}J
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Avg Power</p>
          <p className="text-sm font-semibold tabular-nums">
            {config.timeToGoalSeconds > 0
              ? (config.energyJoules / config.timeToGoalSeconds).toFixed(1)
              : '—'}
            W
          </p>
        </div>
      </div>
    </section>
  );
}
