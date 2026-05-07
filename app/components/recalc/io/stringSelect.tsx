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
  triggerClassName = 'w-[180px]',
}: {
  stateHook: [string, (value: string) => void];
  choices: SelectStringInputChoice[];
  label: string;
  testId?: string;
  triggerClassName?: string;
}) {
  const [value, setValue] = stateHook;

  return (
    <div className="flex flex-row">
      <Label className="mr-2 text-nowrap">{label}</Label>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className={triggerClassName} data-testid={testId}>
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
