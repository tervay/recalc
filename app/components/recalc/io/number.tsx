import { useEffect, useId, useState } from 'react';

import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import type { HasStateHook } from '~/lib/types/common';

/**
 * The text in the box is what the user is editing; the number is what everyone
 * downstream reads. An empty box means zero -- there is no such thing as an
 * absent value here.
 */
function readProxy(text: string) {
  return text === '' ? 0 : Number(text);
}

export default function NumberInput({
  stateHook,
  label,
  tooltip,
  testId,
  labelAbove,
  min,
}: HasStateHook<number> & {
  label: string;
  tooltip?: string;
  testId?: string;
  labelAbove?: boolean;
  min?: number;
}) {
  const [value, setValue] = stateHook;
  const inputId = useId();
  const [proxyValue, setProxyValue] = useState(value.toString());

  // Adopt a value that changed elsewhere, but leave the text alone when it
  // already means that number: an in-progress edit -- an emptied box, a typed
  // "2." -- would otherwise be rewritten out from under the cursor. Adjusting
  // during render rather than in an effect avoids painting the stale text
  // first.
  //
  // Compared with `Object.is`, matching how React itself decides a value
  // changed. A bare `!==` would call a NaN -- which an upstream divide by zero
  // can produce -- different from itself on every render, and loop forever.
  const [lastValue, setLastValue] = useState(value);
  if (!Object.is(value, lastValue)) {
    setLastValue(value);
    if (!Object.is(value, readProxy(proxyValue))) {
      setProxyValue(value.toString());
    }
  }

  // Writes are driven by edits, not by an effect watching the text, so merely
  // mounting an input reports nothing to the state hook.
  const commit = (text: string) => {
    setProxyValue(text);
    setValue(readProxy(text));
  };

  return (
    <div className={labelAbove ? 'flex flex-col' : 'flex flex-row'}>
      {tooltip === undefined ? (
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
      )}
      <Input
        type="number"
        min={min}
        id={inputId}
        value={proxyValue}
        onChange={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            const currentValue = Number(proxyValue) || 0;
            const step = e.shiftKey ? 10 : 1;
            const newValue =
              e.key === 'ArrowUp' ? currentValue + step : currentValue - step;
            commit(newValue.toString());
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
  const inputId = useId();
  const [stringified, setStringified] = useState(state.toFixed(roundTo));

  useEffect(() => {
    setStringified(state.toFixed(roundTo));
  }, [state, roundTo]);

  return (
    <div className="flex flex-row">
      <Label htmlFor={inputId} className="mr-2 text-nowrap">
        {label}
      </Label>
      <Input
        type="number"
        id={inputId}
        disabled
        placeholder={label}
        value={stringified}
        className="disabled:bg-gray-100 disabled:text-gray-900"
        data-testid={testId}
      />
    </div>
  );
}

export function NumberDisplayOutput({
  state,
  label,
  roundTo = 0,
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
    <div className="flex flex-col gap-0.5 rounded-lg border bg-muted/30 px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold tabular-nums" data-testid={testId}>
        {stringified}
      </span>
    </div>
  );
}
