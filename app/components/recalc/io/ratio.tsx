import { useEffect, useId, useRef, useState } from 'react';
import * as z from 'zod';

import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { useDebounce } from '~/lib/hooks';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import type { HasStateHook } from '~/lib/types/common';

const zRatioTypeSchema = z.nativeEnum(RatioType);

export function RatioInput({
  stateHook,
  testId,
  debounceDelay = 0,
  label = 'Ratio',
  labelAbove,
}: HasStateHook<Ratio> & {
  testId?: string;
  debounceDelay?: number;
  label?: string;
  labelAbove?: boolean;
}) {
  const [ratio, setRatio] = stateHook;
  const inputId = useId();
  const [type, setType] = useState(ratio.ratioType);
  const [proxyMagnitude, setProxyMagnitude] = useState(() =>
    ratio.magnitude.toString(),
  );
  const lastInternalRatio = useRef(ratio);

  const debouncedProxyMagnitude = useDebounce(proxyMagnitude, debounceDelay);

  const magnitude =
    debouncedProxyMagnitude !== '' && debouncedProxyMagnitude !== '0'
      ? Number(debouncedProxyMagnitude)
      : 0;

  useEffect(() => {
    if (!ratio.eq(lastInternalRatio.current)) {
      lastInternalRatio.current = ratio;
      setType(ratio.ratioType);
      setProxyMagnitude(ratio.magnitude.toString());
    }
  }, [ratio]);

  useEffect(() => {
    if (debouncedProxyMagnitude !== proxyMagnitude) {
      return;
    }
    const newRatio = new Ratio(magnitude, type);
    if (!newRatio.eq(lastInternalRatio.current)) {
      lastInternalRatio.current = newRatio;
      setRatio(newRatio);
    }
  }, [magnitude, type, proxyMagnitude, debouncedProxyMagnitude, setRatio]);

  return (
    <div className={labelAbove ? 'flex flex-col' : 'flex flex-row'}>
      <Label
        htmlFor={inputId}
        className={
          labelAbove ? 'mb-1 text-xs text-muted-foreground' : 'mr-2 text-nowrap'
        }
      >
        {label}
      </Label>
      <div className="flex w-full flex-row">
        <Input
          type="number"
          min={0}
          id={inputId}
          value={proxyMagnitude}
          onChange={(e) => {
            if (e.target.value !== '') {
              setProxyMagnitude(e.target.value);
            } else {
              setProxyMagnitude('');
            }
          }}
          className="rounded-r-none"
          data-testid={testId}
        />
        <Select
          value={type}
          onValueChange={(value) => {
            const parsed = zRatioTypeSchema.safeParse(value);
            if (parsed.success) setType(parsed.data);
          }}
        >
          <SelectTrigger
            className="rounded-l-none"
            data-testid={testId ? `select${testId}` : undefined}
          >
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(RatioType).map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
