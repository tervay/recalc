import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
interface SelectStringInputChoice {
  label: string;
  value: string;
}

export function StringSelectInput({
  stateHook,
  choices,
  label,
  testId,
  labelAbove,
  triggerClassName,
}: {
  stateHook: [string, (value: string) => void];
  choices: SelectStringInputChoice[];
  label: string;
  testId?: string;
  labelAbove?: boolean;
  triggerClassName?: string;
}) {
  const [value, setValue] = stateHook;

  const resolvedTriggerClassName =
    triggerClassName ?? (labelAbove ? 'w-full' : 'w-[180px]');

  return (
    <div className={labelAbove ? 'flex flex-col' : 'flex flex-row'}>
      <Label
        className={
          labelAbove ? 'mb-1 text-xs text-muted-foreground' : 'mr-2 text-nowrap'
        }
      >
        {label}
      </Label>
      <Select
        value={value}
        items={choices}
        onValueChange={(v) => {
          if (v !== null) setValue(v);
        }}
      >
        <SelectTrigger
          className={resolvedTriggerClassName}
          data-testid={testId}
        >
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
