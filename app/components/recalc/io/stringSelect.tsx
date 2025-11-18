import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import type { HasStateHook } from '~/lib/types/common';

interface SelectStringInputChoice {
  label: string;
  value: string;
}

export function StringSelectInput({
  stateHook,
  choices,
  label,
  testId,
}: HasStateHook<string> & {
  choices: SelectStringInputChoice[];
  label: string;
  testId?: string;
}) {
  const [value, setValue] = stateHook;

  return (
    <div className="flex flex-row">
      <Label className="mr-2 text-nowrap">{label}</Label>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className="w-[180px]" data-testid={testId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {choices.map((choice) => (
            <SelectItem key={choice.value} value={choice.value}>
              {choice.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
