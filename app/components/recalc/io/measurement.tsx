import { useEffect, useId, useMemo, useRef, useState } from 'react';

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

/**
 * Two measurements agree here only when the number and the unit both match.
 * `Measurement.eq` compares physical quantity, so it calls `0 in` and `0 ft` --
 * or `12 in` and `1 ft`, or `5 J` and `5 N*m` -- the same. Under that guard a
 * unit change never reaches the parent, and a value arriving in another unit is
 * never adopted. `Object.is` rather than `===` so a scalar that is not equal to
 * itself cannot report a change on every render and loop, matching `number.tsx`.
 */
function sameReading(a: Measurement, b: Measurement) {
  return Object.is(a.scalar, b.scalar) && a.units() === b.units();
}

/**
 * `Qty` re-spells some units as it parses them: `in^2` comes back as `in2`, and
 * `hr` as `h`. The dropdown lists the spellings `Measurement.choices` uses, so
 * a raw `units()` string can name an option that is not there -- the trigger
 * then shows nothing and the current unit is unreachable. Match on the parsed
 * form and hand back the spelling the list uses.
 */
function selectableUnit(meas: Measurement, choices: string[]) {
  const parsed = meas.units();
  return (
    choices.find((choice) => new Measurement(1, choice).units() === parsed) ??
    parsed
  );
}

export function MeasurementInput({
  stateHook,
  label,
  tooltip,
  disabled,
  testId,
  labelAbove,
}: HasStateHook<Measurement> & {
  label: string;
  tooltip?: string;
  disabled?: () => boolean;
  testId?: string;
  labelAbove?: boolean;
}) {
  const [meas, setMeas] = stateHook;
  const inputId = useId();

  const kinds = useMemo(() => Measurement.choices(meas), [meas]);
  const [scalar, setScalar] = useState(meas.scalar);
  const [unit, setUnit] = useState(() => selectableUnit(meas, kinds));
  const lastInternalMeas = useRef(meas);

  useEffect(() => {
    const newMeas = new Measurement(scalar, unit);
    if (!sameReading(newMeas, lastInternalMeas.current)) {
      lastInternalMeas.current = newMeas;
      setMeas(newMeas);
    }
  }, [scalar, unit, setMeas]);

  useEffect(() => {
    if (!sameReading(meas, lastInternalMeas.current)) {
      lastInternalMeas.current = meas;
      const newScalar = meas.scalar;
      setScalar(newScalar);
      setUnit(selectableUnit(meas, kinds));
      setProxyValue(newScalar.toString());
    }
  }, [meas, kinds]);

  const [proxyValue, setProxyValue] = useState(scalar.toString());

  useEffect(() => {
    if (proxyValue !== '' && proxyValue !== '0') {
      setScalar(Number(proxyValue));
    } else {
      setScalar(0);
    }
  }, [proxyValue, setScalar]);

  const labelEl =
    tooltip === undefined ? (
      <Label
        htmlFor={inputId}
        className={
          labelAbove ? 'mb-1 text-xs text-muted-foreground' : 'mr-2 text-nowrap'
        }
      >
        {label}
      </Label>
    ) : (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Label
              htmlFor={inputId}
              className={
                labelAbove
                  ? 'mb-1 text-xs text-muted-foreground'
                  : 'mr-2 text-nowrap'
              }
            >
              {label}
            </Label>
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

  return (
    <div className={labelAbove ? 'flex flex-col' : 'flex flex-row'}>
      {labelEl}
      <div className="flex w-full flex-row">
        <Input
          type="number"
          id={inputId}
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
        <Select
          value={unit}
          onValueChange={(value) => {
            if (value !== null) setUnit(value);
          }}
        >
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
  labelAbove,
}: {
  state: Measurement;
  label: string;
  defaultUnit?: string;
  tooltip?: string;
  roundTo?: number;
  testId?: string;
  labelAbove?: boolean;
}) {
  const inputId = useId();
  const kinds = useMemo(() => Measurement.choices(state), [state]);
  const [scalar, setScalar] = useState(state.scalar);
  const [unit, setUnit] = useState(
    () => defaultUnit ?? selectableUnit(state, kinds),
  );
  const [stringified, setStringified] = useState(scalar.toFixed(roundTo));

  useEffect(() => {
    setScalar(state.to(unit).scalar);
  }, [state, unit]);

  useEffect(() => {
    setStringified(scalar.toFixed(roundTo));
  }, [scalar, roundTo]);

  const labelEl =
    tooltip === undefined ? (
      <Label
        htmlFor={inputId}
        className={
          labelAbove ? 'mb-1 text-xs text-muted-foreground' : 'mr-2 text-nowrap'
        }
      >
        {label}
      </Label>
    ) : (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Label
              htmlFor={inputId}
              className={
                labelAbove
                  ? 'mb-1 text-xs text-muted-foreground'
                  : 'mr-2 text-nowrap'
              }
            >
              {label}
            </Label>
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

  return (
    <div className={labelAbove ? 'flex flex-col' : 'flex flex-row'}>
      {labelEl}
      <div className="flex w-full flex-row">
        <Input
          type="number"
          id={inputId}
          disabled
          placeholder={label}
          value={stringified}
          className="rounded-r-none disabled:bg-gray-100 disabled:text-gray-900"
          data-testid={testId}
        />
        <Select
          value={unit}
          onValueChange={(value) => {
            if (value !== null) setUnit(value);
          }}
        >
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

export function MeasurementDisplayOutput({
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
  const kinds = useMemo(() => Measurement.choices(state), [state]);
  const [unit, setUnit] = useState(
    () => defaultUnit ?? selectableUnit(state, kinds),
  );
  const [scalar, setScalar] = useState(state.to(unit).scalar);
  const [stringified, setStringified] = useState(scalar.toFixed(roundTo));

  useEffect(() => {
    setScalar(state.to(unit).scalar);
  }, [state, unit]);

  useEffect(() => {
    setStringified(scalar.toFixed(roundTo));
  }, [scalar, roundTo]);

  const inner = (
    <div className="flex flex-col gap-0.5 rounded-lg border bg-muted/30 px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1">
        <span
          className="text-xl font-semibold tabular-nums"
          data-testid={testId}
        >
          {stringified}
        </span>
        <Select
          value={unit}
          onValueChange={(value) => {
            if (value !== null) setUnit(value);
          }}
        >
          <SelectTrigger
            className="h-auto w-auto border-none bg-transparent p-0 text-sm text-muted-foreground shadow-none focus-visible:ring-0"
            data-testid={testId ? `select${testId}` : undefined}
          >
            <SelectValue />
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

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={inner} />
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return inner;
}
