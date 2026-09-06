import { useState } from 'react';

import { MotorNameSelect } from '~/components/recalc/io/motor';
import { Button } from '~/components/ui/button';
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
import { calculateLinearSurfaceSpeed } from '~/lib/math/intake';
import type Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import { ALL_SWERVE_MODULES } from '~/lib/models/SwerveModule';
import type { StateHook } from '~/lib/types/common';

const DEFAULT_MODULE_NAME = 'MK5n';

const MODULE_GROUPS = ALL_SWERVE_MODULES.reduce<
  { vendor: string; modules: typeof ALL_SWERVE_MODULES }[]
>((groups, module) => {
  const group = groups.find((g) => g.vendor === module.vendor);
  if (group) {
    group.modules.push(module);
  } else {
    groups.push({ vendor: module.vendor, modules: [module] });
  }
  return groups;
}, []);

export function SwerveQuickSet({
  driveMotorStateHook,
  drivetrainSpeedStateHook,
}: {
  driveMotorStateHook: StateHook<Motor>;
  drivetrainSpeedStateHook: StateHook<Measurement>;
}) {
  const [driveMotor, setDriveMotor] = driveMotorStateHook;
  const [, setDrivetrainSpeed] = drivetrainSpeedStateHook;
  const [moduleName, setModuleName] = useState(DEFAULT_MODULE_NAME);

  const module = ALL_SWERVE_MODULES.find((m) => m.name === moduleName);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-dashed p-3">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Quick set from a swerve module
      </span>
      <div className="flex flex-row gap-x-4 *:flex-1">
        <MotorNameSelect
          stateHook={[
            driveMotor.identifier,
            (name) => setDriveMotor(Motor.fromName(name, 1)),
          ]}
          label="Drive Motor"
          testId="selectDriveMotor"
          labelAbove
        />
        <div className="flex flex-col">
          <Label className="mb-1 text-xs text-muted-foreground">Module</Label>
          <Select
            value={moduleName}
            onValueChange={(value) => {
              if (value !== null) setModuleName(value);
            }}
          >
            <SelectTrigger className="w-full" data-testid="selectSwerveModule">
              <SelectValue placeholder="Swerve module" />
            </SelectTrigger>
            <SelectContent>
              {MODULE_GROUPS.map((group, i) => (
                <SelectGroup key={group.vendor}>
                  {i > 0 && <SelectSeparator />}
                  <SelectLabel>{group.vendor}</SelectLabel>
                  {group.modules.map((m) => (
                    <SelectItem key={m.name} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {module !== undefined && (
        <div className="flex flex-wrap gap-2">
          {module.driveRatioOptions.map((option) => {
            const speed = calculateLinearSurfaceSpeed(
              driveMotor,
              option.ratio,
              module.wheelDiameter,
            )
              .to('ft/s')
              .round(1);
            return (
              <Button
                key={option.name}
                type="button"
                variant="outline"
                size="sm"
                className="h-auto cursor-pointer flex-col items-center gap-0 py-1.5"
                data-testid={`swerveRatio-${option.name}`}
                onClick={() => setDrivetrainSpeed(speed)}
              >
                <span>{option.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {speed.scalar.toFixed(1)} ft/s
                </span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
