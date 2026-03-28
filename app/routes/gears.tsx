import { useMemo, useState } from 'react';
import TriangleAlertIcon from '~icons/lucide/triangle-alert';

import CalcHeading from '~/components/recalc/calcHeading';
import { GearTable } from '~/components/recalc/gearTable';
import { MeasurementDisplayOutput } from '~/components/recalc/io/measurement';
import NumberInput from '~/components/recalc/io/number';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { calculateSpacing } from '~/lib/math/gears';
import { NumberParam } from '~/lib/types/queryParams';

export function meta() {
  return [
    { title: 'Gears Calculator' },
    { name: 'description', content: 'Gears Calculator' },
  ];
}

const DEFAULT_PARAMS = {
  gear1Teeth: NumberParam.withDefault(16),
  gear2Teeth: NumberParam.withDefault(36),
  gearDP: NumberParam.withDefault(20),
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
      {children}
    </p>
  );
}

export default function Gears() {
  const queryParams = useQueryParams(DEFAULT_PARAMS);

  const [gear1Teeth, setGear1Teeth] = useState(queryParams.gear1Teeth);
  const [gear2Teeth, setGear2Teeth] = useState(queryParams.gear2Teeth);
  const [gearDP, setGearDP] = useState(queryParams.gearDP);

  const spacing = useMemo(
    () => calculateSpacing(gear1Teeth, gear2Teeth, gearDP),
    [gear1Teeth, gear2Teeth, gearDP],
  );

  const serializedState = useSerializedState(DEFAULT_PARAMS, {
    gear1Teeth,
    gear2Teeth,
    gearDP,
  });

  return (
    <div>
      <CalcHeading
        title="Gears Calculator"
        getSerializedState={() => serializedState}
      />
      <div className="flex flex-row flex-wrap gap-x-6 gap-y-6 px-1 *:flex-1">
        {/* Left column: configuration + results */}
        <div className="flex min-w-0 flex-col gap-y-4">
          {/* Parameters */}
          <div className="rounded-xl border bg-muted/20 p-4 shadow-sm">
            <div className="mb-3">
              <SectionLabel>Parameters</SectionLabel>
            </div>
            <div className="flex flex-col gap-y-3">
              <div className="flex flex-wrap gap-x-4 gap-y-3 *:flex-1 md:flex-nowrap">
                <NumberInput
                  stateHook={[gear1Teeth, setGear1Teeth]}
                  label="Gear 1 Teeth"
                  testId="gear1Teeth"
                  labelAbove
                />
                <NumberInput
                  stateHook={[gear2Teeth, setGear2Teeth]}
                  label="Gear 2 Teeth"
                  testId="gear2Teeth"
                  labelAbove
                />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-3 *:flex-1 md:flex-nowrap">
                <NumberInput
                  stateHook={[gearDP, setGearDP]}
                  label="Gear DP"
                  testId="gearDP"
                  labelAbove
                />
              </div>
            </div>
          </div>

          <MeasurementDisplayOutput
            state={spacing}
            label="Center Distance"
            defaultUnit="in"
            testId="spacing"
          />

          {/* Warning */}
          <div className="flex gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-muted-foreground">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
            <p>
              Many smaller gears have a different pitch diameter than their
              tooth count.{' '}
              <span className="font-medium text-foreground">
                This calculator does not account for this.
              </span>{' '}
              For example,{' '}
              <a
                href="https://wcproducts.com/products/wcp-1720"
                className="underline underline-offset-4 hover:text-foreground"
              >
                WCP-1720
              </a>{' '}
              has 16t but an 18t center distance — use 18t in this calculator.
            </p>
          </div>
        </div>

        {/* Right column: COTS table */}
        <div className="flex w-auto flex-col gap-y-4">
          <GearTable
            filterFn={(gear) =>
              (gear.teeth === gear1Teeth || gear.teeth === gear2Teeth) &&
              gear.dp === gearDP
            }
          />
        </div>
      </div>
    </div>
  );
}
