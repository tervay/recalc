import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import type { Bore, HasStateHook } from '~/lib/types/common';

const BORE_OPTIONS: Bore[] = [
  '8mm',
  '1.125" Round',
  '1/4" Round',
  '1/2" Hex',
  '3/8" Hex',
  'SplineXS',
  'SplineXL',
  'MAXSpline',
  'Falcon',
  'RS775',
  'RS550',
  'BAG',
  'Vortex',
  '5mm Hex',
];

export default function BoreInput({
  stateHook,
  label = 'Bore',
  testId,
}: HasStateHook<Bore> & {
  label?: string;
  testId?: string;
}) {
  const [value, setValue] = stateHook;

  return (
    <div className="flex flex-row">
      <Label className="mr-2 text-nowrap">{label}</Label>
      <Select value={value} onValueChange={(val) => setValue(val as Bore)}>
        <SelectTrigger className="w-[180px]" data-testid={testId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BORE_OPTIONS.map((bore) => (
            <SelectItem key={bore} value={bore}>
              {bore}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
