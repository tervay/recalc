import { useEffect, useState } from 'react';

import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import Motor, { ALL_MOTORS } from '~/lib/models/Motor';
import type { HasStateHook } from '~/lib/types/common';

export function MotorInput({
  stateHook,
  testId,
}: HasStateHook<Motor> & { testId?: string }) {
  const [motor, setMotor] = stateHook;
  const [name, setName] = useState(motor.identifier);
  const [quantity, setQuantity] = useState(motor.quantity);

  const [proxyQuantity, setProxyQuantity] = useState(quantity.toString());

  useEffect(() => {
    setMotor(Motor.fromName(name, quantity));
  }, [name, quantity, setMotor]);

  useEffect(() => {
    if (proxyQuantity !== '' && proxyQuantity !== '0') {
      setQuantity(Number(proxyQuantity));
    } else {
      setQuantity(0);
    }
  }, [proxyQuantity, setQuantity]);

  return (
    <div className="flex flex-row">
      <Label htmlFor="measurement" className="mr-2 text-nowrap">
        Motor
      </Label>
      <div className="flex w-full flex-row">
        <Input
          type="number"
          id="measurement"
          value={proxyQuantity}
          onChange={(e) => {
            if (e.target.value !== '') {
              setProxyQuantity(e.target.value);
            } else {
              setProxyQuantity('');
            }
          }}
          className="rounded-r-none"
          data-testid={testId}
        />
        <Select value={name} onValueChange={setName}>
          <SelectTrigger
            className="rounded-l-none"
            data-testid={testId ? `select${testId}` : undefined}
          >
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            {ALL_MOTORS.map((m) => (
              <SelectItem key={m.name} value={m.name}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
