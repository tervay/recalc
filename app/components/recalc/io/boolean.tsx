import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';
import type { HasStateHook } from '~/lib/types/common';

export default function BooleanInput({
  stateHook,
  label,
  testId,
  labelAbove,
}: HasStateHook<boolean> & {
  label: string;
  testId?: string;
  labelAbove?: boolean;
}) {
  const [value, setValue] = stateHook;

  if (labelAbove) {
    return (
      <div className="flex flex-col">
        <Label htmlFor={label} className="mb-1 text-xs text-muted-foreground">
          {label}
        </Label>
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
      <Label htmlFor={label}>{label}</Label>
    </div>
  );
}
