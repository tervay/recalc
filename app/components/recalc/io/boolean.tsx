import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import type { HasStateHook } from '~/lib/types/common';

export default function BooleanInput({
  stateHook,
  label,
  testId,
  labelAbove,
  tooltip,
}: HasStateHook<boolean> & {
  label: string;
  testId?: string;
  labelAbove?: boolean;
  tooltip?: string;
}) {
  const [value, setValue] = stateHook;

  const labelNode =
    tooltip === undefined ? (
      <Label htmlFor={label}>{label}</Label>
    ) : (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Label htmlFor={label} className="cursor-help">
              {label}
            </Label>
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

  if (labelAbove) {
    return (
      <div className="flex flex-col">
        <div className="mb-1 text-xs text-muted-foreground">{labelNode}</div>
        <div className="flex h-9 items-center">
          <Switch
            id={label}
            checked={value}
            onCheckedChange={setValue}
            data-testid={testId}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center gap-2">
      <Switch
        id={label}
        checked={value}
        onCheckedChange={setValue}
        data-testid={testId}
      />
      {labelNode}
    </div>
  );
}
