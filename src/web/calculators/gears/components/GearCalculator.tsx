import SimpleHeading from "common/components/heading/SimpleHeading";
import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import { NumberInput } from "common/components/io/new/inputs";
import MeasurementOutput from "common/components/io/outputs/MeasurementOutput";
import { Column, Columns } from "common/components/styling/Building";
import { useGettersSetters } from "common/tooling/conversion";
import { useMemo } from "react";
import gearConfig, { GearParamsV1, GearStateV1 } from "web/calculators/gears";
import GearCheatSheet from "web/calculators/gears/components/COTSGearTable";
import { GearState } from "web/calculators/gears/converter";
import { calculateSpacing } from "web/calculators/gears/math";

export default function GearCalculator(): JSX.Element {
  const [get, set] = useGettersSetters(GearState.getState() as GearStateV1);

  const ccSpace = useMemo(
    () => calculateSpacing(get.gear1Teeth, get.gear2Teeth, get.gearDP),
    [get.gear1Teeth, get.gear2Teeth, get.gearDP],
  );

  return (
    <>
      <SimpleHeading
        queryParams={GearParamsV1}
        state={get}
        title={gearConfig.title}
      />

      <Columns>
        <Column>
          <SingleInputLine label="Gear 1 Teeth" id="gear1Teeth">
            <NumberInput stateHook={[get.gear1Teeth, set.setGear1Teeth]} />
          </SingleInputLine>

          <SingleInputLine label="Gear 2 Teeth" id="gear2Teeth">
            <NumberInput stateHook={[get.gear2Teeth, set.setGear2Teeth]} />
          </SingleInputLine>

          <SingleInputLine label="Gear DP" id="gearDP">
            <NumberInput stateHook={[get.gearDP, set.setGearDP]} />
          </SingleInputLine>
          <SingleInputLine label="Center-to-Center Spacing" id="ccSpace">
            <MeasurementOutput
              stateHook={[ccSpace, () => undefined]}
              numberRoundTo={3}
            />
          </SingleInputLine>
        </Column>

        <Column>
          <GearCheatSheet
            gear1Teeth={get.gear1Teeth}
            gear2Teeth={get.gear2Teeth}
            gearDP={get.gearDP}
          />
        </Column>
      </Columns>
    </>
  );
}
