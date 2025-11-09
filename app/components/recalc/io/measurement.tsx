import { useEffect, useMemo, useRef, useState } from 'react';

import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import Measurement from '~/lib/models/Measurement';
import type { HasStateHook } from '~/lib/types/common';

export function MeasurementInput({
  stateHook,
  label,
  tooltip,
  disabled,
  testId,
}: HasStateHook<Measurement> & {
  label: string;
  tooltip?: string;
  disabled?: () => boolean;
  testId?: string;
}) {
  const [meas, setMeas] = stateHook;

  const [scalar, setScalar] = useState(meas.scalar);
  const [unit, setUnit] = useState(meas.units());
  const kinds = useMemo(() => Measurement.choices(meas), [meas]);
  const lastInternalMeas = useRef(meas);

  useEffect(() => {
    const newMeas = new Measurement(scalar, unit);
    if (!newMeas.eq(lastInternalMeas.current)) {
      lastInternalMeas.current = newMeas;
      setMeas(newMeas);
    }
  }, [scalar, unit, setMeas]);

  useEffect(() => {
    if (!meas.eq(lastInternalMeas.current)) {
      lastInternalMeas.current = meas;
      const newScalar = meas.scalar;
      const newUnit = meas.units();
      setScalar(newScalar);
      setUnit(newUnit);
      setProxyValue(newScalar.toString());
    }
  }, [meas]);

  const [proxyValue, setProxyValue] = useState(scalar.toString());

  useEffect(() => {
    if (proxyValue !== '' && proxyValue !== '0') {
      setScalar(Number(proxyValue));
    } else {
      setScalar(0);
    }
  }, [proxyValue, setScalar]);

  return (
    <div className="flex flex-row">
      {tooltip === undefined ? (
        <Label htmlFor="measurement" className="mr-2 text-nowrap">
          {label}
        </Label>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Label htmlFor="measurement" className="mr-2 text-nowrap">
                {label}
              </Label>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <div className="flex w-full flex-row">
        <Input
          type="number"
          id="measurement"
          placeholder={label}
          value={proxyValue}
          onChange={(e) => {
            if (e.target.value !== '') {
              setProxyValue(e.target.value);
            } else {
              setProxyValue('');
            }
          }}
          className="rounded-r-none disabled:bg-gray-100 disabled:text-gray-900"
          disabled={disabled?.()}
          data-testid={testId}
        />
        <Select value={unit} onValueChange={setUnit}>
          <SelectTrigger
            className="rounded-l-none"
            data-testid={testId ? `select${testId}` : undefined}
          >
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            {kinds.map((kind) => (
              <SelectItem key={kind} value={kind}>
                {kind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function MeasurementOutput({
  state,
  label,
  defaultUnit,
  tooltip,
  roundTo = 3,
  testId,
}: {
  state: Measurement;
  label: string;
  defaultUnit?: string;
  tooltip?: string;
  roundTo?: number;
  testId?: string;
}) {
  const [scalar, setScalar] = useState(state.scalar);
  const [unit, setUnit] = useState(defaultUnit ?? state.units());
  const kinds = useMemo(() => Measurement.choices(state), [state]);
  const [stringified, setStringified] = useState(scalar.toFixed(roundTo));

  useEffect(() => {
    setScalar(state.to(unit).scalar);
  }, [state, unit]);

  useEffect(() => {
    setStringified(scalar.toFixed(roundTo));
  }, [scalar, roundTo]);

  return (
    <div className="flex flex-row">
      {tooltip === undefined ? (
        <Label htmlFor="measurement" className="mr-2 text-nowrap">
          {label}
        </Label>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Label htmlFor="measurement" className="mr-2 text-nowrap">
                {label}
              </Label>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <div className="flex w-full flex-row">
        <Input
          type="number"
          id="measurement"
          disabled
          placeholder={label}
          value={stringified}
          className="rounded-r-none disabled:bg-gray-100 disabled:text-gray-900"
          data-testid={testId}
        />
        <Select value={unit} onValueChange={setUnit}>
          <SelectTrigger
            className="rounded-l-none"
            data-testid={testId ? `select${testId}` : undefined}
          >
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            {kinds.map((kind) => (
              <SelectItem key={kind} value={kind}>
                {kind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
