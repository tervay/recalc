import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';

export function InStockToggle({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Label className="cursor-pointer justify-self-end text-xs font-normal text-muted-foreground">
      <Switch size="sm" checked={checked} onCheckedChange={onCheckedChange} />
      In stock only
    </Label>
  );
}
