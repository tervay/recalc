import { useMemo, useState } from 'react';

import IOLine from '~/components/recalc/blocks';
import CalcHeading from '~/components/recalc/calcHeading';
import Divider from '~/components/recalc/divider';
import BooleanInput from '~/components/recalc/io/boolean';
import {
  MeasurementInput,
  MeasurementOutput,
} from '~/components/recalc/io/measurement';
import NumberInput, { NumberOutput } from '~/components/recalc/io/number';
import { StringSelectInput } from '~/components/recalc/io/stringSelect';
import { SprocketTable } from '~/components/recalc/sprocketTable';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { calculateCenters } from '~/lib/math/chains';
import Measurement from '~/lib/models/Measurement';
import { SimpleSprocket } from '~/lib/models/Sprocket';
import {
  BooleanParam,
  MeasurementParam,
  NumberParam,
  StringParam,
  withDefault,
} from '~/lib/types/queryParams';

export function meta() {
  return [
    { title: 'Chain Calculator' },
    { name: 'description', content: 'Chain Calculator' },
  ];
}

const DEFAULT_PARAMS = {
  chain: withDefault(StringParam, '#25'),
  p1Teeth: withDefault(NumberParam, 16),
  p2Teeth: withDefault(NumberParam, 36),
  desiredCenter: withDefault(MeasurementParam, new Measurement(5, 'in')),
  extraCenter: withDefault(MeasurementParam, new Measurement(0, 'in')),
  allowHalfLinks: withDefault(BooleanParam, false),
};

export default function Chains() {
  const queryParams = useQueryParams<{
    chain: string;
    p1Teeth: number;
    p2Teeth: number;
    desiredCenter: Measurement;
    extraCenter: Measurement;
    allowHalfLinks: boolean;
  }>(DEFAULT_PARAMS);

  const [chain, setChain] = useState(queryParams.chain);
  const [p1Teeth, setP1Teeth] = useState(queryParams.p1Teeth);
  const [p2Teeth, setP2Teeth] = useState(queryParams.p2Teeth);
  const [desiredCenter, setDesiredCenter] = useState(queryParams.desiredCenter);
  const [extraCenter, setExtraCenter] = useState(queryParams.extraCenter);
  const [allowHalfLinks, setAllowHalfLinks] = useState(
    queryParams.allowHalfLinks,
  );

  const p1PitchDiameter = useMemo(() => {
    return new SimpleSprocket(p1Teeth, chain).pitchDiameter;
  }, [p1Teeth, chain]);

  const p2PitchDiameter = useMemo(() => {
    return new SimpleSprocket(p2Teeth, chain).pitchDiameter;
  }, [p2Teeth, chain]);

  const results = useMemo(
    () =>
      calculateCenters(chain, p1Teeth, p2Teeth, desiredCenter, allowHalfLinks),
    [chain, p1Teeth, p2Teeth, desiredCenter, allowHalfLinks],
  );

  const serializedState = useSerializedState(DEFAULT_PARAMS, {
    chain,
    p1Teeth,
    p2Teeth,
    desiredCenter,
    extraCenter,
    allowHalfLinks,
  });

  return (
    <div>
      <CalcHeading
        title="Chain Calculator"
        getSerializedState={() => serializedState}
      />

      <div className="flex flex-row flex-wrap gap-x-4 px-1 [&>*]:flex-1">
        <div className="flex flex-col gap-x-4 gap-y-2">
          <IOLine>
            <StringSelectInput
              stateHook={[chain, setChain]}
              label="Chain Type"
              choices={[
                { label: '#25', value: '#25' },
                { label: '#35', value: '#35' },
              ]}
            />
            <BooleanInput
              stateHook={[allowHalfLinks, setAllowHalfLinks]}
              label="Allow Half Links"
            />
          </IOLine>

          <IOLine>
            <MeasurementInput
              stateHook={[desiredCenter, setDesiredCenter]}
              label="Desired Center"
            />
            <MeasurementInput
              stateHook={[extraCenter, setExtraCenter]}
              label="Extra Center"
            />
          </IOLine>

          <Divider>Sprocket 1</Divider>
          <IOLine>
            <NumberInput stateHook={[p1Teeth, setP1Teeth]} label="Teeth" />
            <MeasurementOutput
              state={p1PitchDiameter}
              label="Pitch Diameter"
              defaultUnit="in"
            />
          </IOLine>

          <Divider>Sprocket 2</Divider>
          <IOLine>
            <NumberInput stateHook={[p2Teeth, setP2Teeth]} label="Teeth" />
            <MeasurementOutput
              state={p2PitchDiameter}
              label="Pitch Diameter"
              defaultUnit="in"
            />
          </IOLine>

          <Divider>Smaller Chain</Divider>
          <IOLine>
            <NumberOutput
              state={results.smaller.links}
              label="Chain Links"
              roundTo={0}
            />
            <MeasurementOutput
              state={results.smaller.distance}
              label="Center Distance"
              defaultUnit="in"
            />
          </IOLine>

          <Divider>Larger Chain</Divider>
          <IOLine>
            <NumberOutput
              state={results.larger.links}
              label="Chain Links"
              roundTo={0}
            />
            <MeasurementOutput
              state={results.larger.distance}
              label="Center Distance"
              defaultUnit="in"
            />
          </IOLine>
        </div>

        <div className="flex w-auto flex-col gap-x-4 gap-y-4">
          <SprocketTable
            filterFn={(sprocket) =>
              sprocket.chainType === chain &&
              (sprocket.teeth === p1Teeth || sprocket.teeth === p2Teeth)
            }
          />
        </div>
      </div>
    </div>
  );
}
