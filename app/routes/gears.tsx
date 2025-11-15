import { AlertCircleIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import IOLine from '~/components/recalc/blocks';
import CalcHeading from '~/components/recalc/calcHeading';
import { GearTable } from '~/components/recalc/gearTable';
import { MeasurementOutput } from '~/components/recalc/io/measurement';
import NumberInput from '~/components/recalc/io/number';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { calculateSpacing } from '~/lib/math/gears';
import { NumberParam, withDefault } from '~/lib/types/queryParams';

export function meta() {
  return [
    { title: 'Gears Calculator' },
    { name: 'description', content: 'Gears Calculator' },
  ];
}

const DEFAULT_PARAMS = {
  gear1Teeth: withDefault(NumberParam, 16),
  gear2Teeth: withDefault(NumberParam, 36),
  gearDP: withDefault(NumberParam, 20),
};

export default function Gears() {
  const queryParams = useQueryParams<{
    gear1Teeth: number;
    gear2Teeth: number;
    gearDP: number;
  }>(DEFAULT_PARAMS);

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
      <div className="flex flex-col gap-4 px-1 *:flex-1 md:flex-row md:gap-x-4">
        <div className="flex flex-col gap-x-4 gap-y-2">
          <IOLine>
            <NumberInput
              stateHook={[gear1Teeth, setGear1Teeth]}
              label="Gear 1 Teeth"
            />
          </IOLine>
          <IOLine>
            <NumberInput
              stateHook={[gear2Teeth, setGear2Teeth]}
              label="Gear 2 Teeth"
            />
          </IOLine>
          <IOLine>
            <NumberInput stateHook={[gearDP, setGearDP]} label="Gear DP" />
          </IOLine>
          <IOLine>
            <MeasurementOutput
              state={spacing}
              label="Center Distance"
              defaultUnit="in"
            />
          </IOLine>
          <div className="mt-12 w-full">
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Warning!</AlertTitle>
              <AlertDescription>
                <p>
                  Many smaller gears have a different pitch diameter / center
                  distance than the teeth they actually have.{' '}
                  <b>This calculator does not account for this!</b>
                </p>
                <p>
                  For example,{' '}
                  <a href="https://wcproducts.com/products/wcp-1720">
                    WCP-1720
                  </a>{' '}
                  has 16t but an 18t center distance. For this calculator, you
                  would use it as an 18t gear.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </div>
        <div className="flex flex-col gap-x-4 gap-y-2">
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
