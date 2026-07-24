import { Fragment, useEffect, useState } from 'react';

import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import Motor, { ALL_MOTORS, IntendedProgram } from '~/lib/models/Motor';
import type { HasStateHook } from '~/lib/types/common';

const PROGRAM_ORDER: { program: IntendedProgram; label: string }[] = [
  { program: IntendedProgram.FRC, label: 'FRC' },
  { program: IntendedProgram.FTC, label: 'FTC' },
  { program: IntendedProgram.OTHER, label: 'Other' },
];

// Precomputed once: ALL_MOTORS is static, so there's no need to re-filter on
// every render.
const MOTOR_GROUPS = PROGRAM_ORDER.map(({ program, label }) => ({
  label,
  motors: ALL_MOTORS.filter((m) => m.intendedProgram === program),
})).filter((group) => group.motors.length > 0);

// Shared between MotorInput and MotorNameSelect so both selectors present
// the same grouping and stay in sync if the grouping logic changes.
function MotorSelectContent() {
  return (
    <>
      {MOTOR_GROUPS.map((group, i) => (
        <Fragment key={group.label}>
          {i > 0 && <SelectSeparator />}
          <SelectGroup>
            <SelectLabel>{group.label}</SelectLabel>
            {group.motors.map((m) => (
              <SelectItem key={m.name} value={m.name}>
                {m.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </Fragment>
      ))}
    </>
  );
}

export function MotorNameSelect({
  stateHook,
  label,
  testId,
  labelAbove,
  triggerClassName,
}: {
  stateHook: [string, (value: string) => void];
  label?: string;
  testId?: string;
  labelAbove?: boolean;
  triggerClassName?: string;
}) {
  const [name, setName] = stateHook;

  const resolvedTriggerClassName =
    triggerClassName ?? (labelAbove ? 'w-full' : 'w-[180px]');

  return (
    <div className={labelAbove ? 'flex flex-col' : 'flex flex-row'}>
      {label !== undefined && (
        <Label
          className={
            labelAbove
              ? 'mb-1 text-xs text-muted-foreground'
              : 'mr-2 text-nowrap'
          }
        >
          {label}
        </Label>
      )}
      <Select
        value={name}
        onValueChange={(value) => {
          if (value !== null) setName(value);
        }}
      >
        <SelectTrigger
          className={resolvedTriggerClassName}
          data-testid={testId}
        >
          <SelectValue placeholder="Motor" />
        </SelectTrigger>
        <SelectContent>
          <MotorSelectContent />
        </SelectContent>
      </Select>
    </div>
  );
}

export function MotorInput({
  stateHook,
  testId,
  labelAbove,
}: HasStateHook<Motor> & { testId?: string; labelAbove?: boolean }) {
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
    <div className={labelAbove ? 'flex flex-col' : 'flex flex-row'}>
      <Label
        htmlFor="measurement"
        className={
          labelAbove ? 'mb-1 text-xs text-muted-foreground' : 'mr-2 text-nowrap'
        }
      >
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
        <Select
          value={name}
          onValueChange={(value) => {
            if (value !== null) setName(value);
          }}
        >
          <SelectTrigger
            className="rounded-l-none"
            data-testid={testId ? `select${testId}` : undefined}
          >
            <SelectValue placeholder="Motor" />
          </SelectTrigger>
          <SelectContent>
            <MotorSelectContent />
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
