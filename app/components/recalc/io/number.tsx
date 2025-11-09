import { useEffect, useState } from 'react';

import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import type { HasStateHook } from '~/lib/types/common';

export default function NumberInput({
  stateHook,
  label,
  tooltip,
  testId,
}: HasStateHook<number> & {
  label: string;
  tooltip?: string;
  testId?: string;
}) {
  const [value, setValue] = stateHook;
  const [proxyValue, setProxyValue] = useState(value.toString());

  useEffect(() => {
    setProxyValue(value.toString());
  }, [value]);

  useEffect(() => {
    if (proxyValue !== '' && proxyValue !== '0') {
      setValue(Number(proxyValue));
    } else {
      setValue(0);
    }
  }, [proxyValue, setValue]);

  return (
    <div className="flex flex-row">
      {tooltip === undefined ? (
        <Label htmlFor="number" className="mr-2 text-nowrap">
          {label}
        </Label>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Label htmlFor="number" className="mr-2 text-nowrap">
                {label}
              </Label>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <Input
        type="number"
        value={proxyValue}
        onChange={(e) => {
          if (e.target.value !== '') {
            setProxyValue(e.target.value);
          } else {
            setProxyValue('');
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            const currentValue = Number(proxyValue) || 0;
            const step = e.shiftKey ? 10 : 1;
            const newValue =
              e.key === 'ArrowUp' ? currentValue + step : currentValue - step;
            setProxyValue(newValue.toString());
            e.preventDefault();
          }
        }}
        data-testid={testId}
      />
    </div>
  );
}

export function NumberOutput({
  state,
  label,
  roundTo = 3,
  testId,
}: {
  state: number;
  label: string;
  roundTo?: number;
  testId?: string;
}) {
  const [stringified, setStringified] = useState(state.toFixed(roundTo));

  useEffect(() => {
    setStringified(state.toFixed(roundTo));
  }, [state, roundTo]);

  return (
    <div className="flex flex-row">
      <Label htmlFor="measurement" className="mr-2 text-nowrap">
        {label}
      </Label>
      <Input
        type="number"
        id="measurement"
        disabled
        placeholder={label}
        value={stringified}
        className="disabled:bg-gray-100 disabled:text-gray-900"
        data-testid={testId}
      />
    </div>
  );
}
