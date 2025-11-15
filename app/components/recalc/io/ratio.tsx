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
import { useDebounce } from '~/lib/hooks';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import type { HasStateHook } from '~/lib/types/common';

export function RatioInput({
  stateHook,
  testId,
  debounceDelay = 0,
}: HasStateHook<Ratio> & { testId?: string; debounceDelay?: number }) {
  const [ratio, setRatio] = stateHook;
  const [magnitude, setMagnitude] = useState(ratio.magnitude);
  const [type, setType] = useState(ratio.ratioType);

  const [proxyMagnitude, setProxyMagnitude] = useState(magnitude.toString());
  const debouncedProxyMagnitude = useDebounce(proxyMagnitude, debounceDelay);

  useEffect(() => {
    setMagnitude(ratio.magnitude);
    setType(ratio.ratioType);
    setProxyMagnitude(ratio.magnitude.toString());
  }, [ratio]);

  useEffect(() => {
    setRatio(new Ratio(magnitude, type));
  }, [magnitude, type, setRatio]);

  useEffect(() => {
    if (debouncedProxyMagnitude !== '' && debouncedProxyMagnitude !== '0') {
      setMagnitude(Number(debouncedProxyMagnitude));
    } else {
      setMagnitude(0);
    }
  }, [debouncedProxyMagnitude, setMagnitude]);

  return (
    <div className="flex flex-row">
      <Label htmlFor="measurement" className="mr-2 text-nowrap">
        Ratio
      </Label>
      <div className="flex w-full flex-row">
        <Input
          type="number"
          id="measurement"
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
            setType(value as RatioType);
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
