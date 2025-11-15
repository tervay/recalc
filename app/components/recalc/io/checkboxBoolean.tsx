import { Checkbox } from '~/components/ui/checkbox';
import { Label } from '~/components/ui/label';
import type { HasStateHook } from '~/lib/types/common';

export default function CheckboxBooleanInput({
  stateHook,
  label,
  testId,
}: HasStateHook<boolean> & {
  label: string;
  testId?: string;
}) {
  const [value, setValue] = stateHook;

  return (
    <div className="flex flex-row items-center gap-2">
      <Checkbox
        id={label}
        checked={value}
        onCheckedChange={(checked) => setValue(checked === true)}
        data-testid={testId}
      />
      <Label htmlFor={label}>{label}</Label>
    </div>
  );
}
