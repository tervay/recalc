import SimpleHeading from "common/components/heading/SimpleHeading";
import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import {
  BooleanInput,
  MeasurementInput,
  NumberInput,
} from "common/components/io/new/inputs";
import MeasurementOutput from "common/components/io/outputs/MeasurementOutput";
import NumericOutput from "common/components/io/outputs/NumberOutput";
import { Column, Columns, Divider } from "common/components/styling/Building";
import Belt from "common/models/Belt";
import Measurement from "common/models/Measurement";
import Pulley from "common/models/Pulley";
import { useGettersSetters } from "common/tooling/conversion";
import { useEffect, useState } from "react";
import { BeltsParamsV1, BeltsStateV1 } from "web/calculators/belts";
import InventoryTable from "web/calculators/belts/components/InventoryTable";
import { PulleyCheatSheet } from "web/calculators/belts/components/PulleyCheatSheet";
import { BeltState } from "web/calculators/belts/converter";
import {
  calculateClosestCenters,
  calculateDistance,
  calculateDistanceBetweenPulleys,
  ClosestCentersResult,
  teethInMesh,
} from "web/calculators/belts/math";

export default function BeltsCalculator(): JSX.Element {
  const [get, set] = useGettersSetters(BeltState.getState() as BeltsStateV1);

  const calculate = {
    p1PD: () => Pulley.fromTeeth(get.p1Teeth, get.pitch).pitchDiameter,
    p2PD: () => Pulley.fromTeeth(get.p2Teeth, get.pitch).pitchDiameter,
    smallerCenter: (res: ClosestCentersResult) => res.smaller.distance,
    smallerTeeth: (res: ClosestCentersResult) => res.smaller.belt.teeth,
    largerCenter: (res: ClosestCentersResult) => res.larger.distance,
    largerTeeth: (res: ClosestCentersResult) => res.larger.belt.teeth,
    p1SmallMesh: () =>
      teethInMesh(
        Pulley.fromTeeth(get.p1Teeth, get.pitch),
        Pulley.fromTeeth(get.p2Teeth, get.pitch),
        smallerCenter,
        Pulley.fromTeeth(get.p1Teeth, get.pitch)
      ),
    p2SmallMesh: () =>
      teethInMesh(
        Pulley.fromTeeth(get.p1Teeth, get.pitch),
        Pulley.fromTeeth(get.p2Teeth, get.pitch),
        smallerCenter,
        Pulley.fromTeeth(get.p2Teeth, get.pitch)
      ),
    p1LargeMesh: () =>
      teethInMesh(
        Pulley.fromTeeth(get.p1Teeth, get.pitch),
        Pulley.fromTeeth(get.p2Teeth, get.pitch),
        largerCenter,
        Pulley.fromTeeth(get.p1Teeth, get.pitch)
      ),
    p2LargeMesh: () =>
      teethInMesh(
        Pulley.fromTeeth(get.p1Teeth, get.pitch),
        Pulley.fromTeeth(get.p2Teeth, get.pitch),
        largerCenter,
        Pulley.fromTeeth(get.p2Teeth, get.pitch)
      ),
    smallDistanceBetweenPulleys: () =>
      calculateDistanceBetweenPulleys(
        Pulley.fromTeeth(get.p1Teeth, get.pitch),
        Pulley.fromTeeth(get.p2Teeth, get.pitch),
        smallerCenter
      ),
    largeDistanceBetweenPulleys: () =>
      calculateDistanceBetweenPulleys(
        Pulley.fromTeeth(get.p1Teeth, get.pitch),
        Pulley.fromTeeth(get.p2Teeth, get.pitch),
        largerCenter
      ),
  };

  const [p1pd, setP1PD] = useState(calculate.p1PD());
  const [p2pd, setP2PD] = useState(calculate.p2PD());

  const results = calculateClosestCenters(
    Pulley.fromTeeth(get.p1Teeth, get.pitch),
    Pulley.fromTeeth(get.p2Teeth, get.pitch),
    get.desiredCenter,
    get.toothIncrement
  );

  const [smallerCenter, setSmallerCenter] = useState(
    calculate.smallerCenter(results)
  );
  const [smallerTeeth, setSmallerTeeth] = useState(
    calculate.smallerTeeth(results)
  );
  const [largerCenter, setLargerCenter] = useState(
    calculate.largerCenter(results)
  );
  const [largerTeeth, setLargerTeeth] = useState(
    calculate.largerTeeth(results)
  );

  const [p1SmallMesh, setP1SmallMesh] = useState(calculate.p1SmallMesh());
  const [p2SmallMesh, setP2SmallMesh] = useState(calculate.p2SmallMesh());
  const [p1LargeMesh, setP1LargeMesh] = useState(calculate.p1LargeMesh());
  const [p2LargeMesh, setP2LargeMesh] = useState(calculate.p2LargeMesh());
  const [smallPulleyGap, setSmallPulleyGap] = useState(
    calculate.smallDistanceBetweenPulleys()
  );
  const [largePulleyGap, setLargePulleyGap] = useState(
    calculate.largeDistanceBetweenPulleys()
  );

  useEffect(() => {
    setP1PD(calculate.p1PD());
  }, [get.p1Teeth, get.pitch]);

  useEffect(() => {
    setP2PD(calculate.p2PD());
  }, [get.p2Teeth, get.pitch]);

  useEffect(() => {
    setP1SmallMesh(calculate.p1SmallMesh());
    setP2SmallMesh(calculate.p2SmallMesh());
    setP1LargeMesh(calculate.p1LargeMesh());
    setP2LargeMesh(calculate.p2LargeMesh());
  }, [get.p1Teeth, get.p2Teeth, get.pitch, smallerCenter, largerCenter]);

  useEffect(() => {
    if (get.useCustomBelt) {
      const dist = calculateDistance(
        Pulley.fromTeeth(get.p1Teeth, get.pitch),
        Pulley.fromTeeth(get.p2Teeth, get.pitch),
        Belt.fromTeeth(get.customBeltTeeth, get.pitch)
      );

      setSmallerCenter(dist.add(get.extraCenter).to(smallerCenter.units()));
      setSmallerTeeth(get.customBeltTeeth);
    } else {
      const results = calculateClosestCenters(
        Pulley.fromTeeth(get.p1Teeth, get.pitch),
        Pulley.fromTeeth(get.p2Teeth, get.pitch),
        get.desiredCenter,
        get.toothIncrement
      );

      setLargerCenter(calculate.largerCenter(results).add(get.extraCenter));
      setLargerTeeth(calculate.largerTeeth(results));
      setSmallerCenter(calculate.smallerCenter(results).add(get.extraCenter));
      setSmallerTeeth(calculate.smallerTeeth(results));
    }
  }, [
    get.p1Teeth,
    get.p2Teeth,
    get.desiredCenter,
    get.toothIncrement,
    get.pitch,
    get.extraCenter,
    get.useCustomBelt,
    get.customBeltTeeth,
    get.pitch,
  ]);

  useEffect(() => {
    setSmallPulleyGap(calculate.smallDistanceBetweenPulleys());
  }, [get.p1Teeth, get.p2Teeth, get.pitch, smallerCenter]);

  useEffect(() => {
    setLargePulleyGap(calculate.largeDistanceBetweenPulleys());
  }, [get.p1Teeth, get.p2Teeth, get.pitch, largerCenter]);

  let cheatSheet = (
    <PulleyCheatSheet pitch={new Measurement(999, "mm")} currentPulleys={[]} />
  );
  if (get.pitch.eq(new Measurement(3, "mm"))) {
    cheatSheet = (
      <PulleyCheatSheet
        pitch={new Measurement(3, "mm")}
        currentPulleys={[
          Pulley.fromTeeth(get.p1Teeth, get.pitch),
          Pulley.fromTeeth(get.p2Teeth, get.pitch),
        ]}
      />
    );
  } else if (get.pitch.eq(new Measurement(5, "mm"))) {
    cheatSheet = (
      <PulleyCheatSheet
        pitch={new Measurement(5, "mm")}
        currentPulleys={[
          Pulley.fromTeeth(get.p1Teeth, get.pitch),
          Pulley.fromTeeth(get.p2Teeth, get.pitch),
        ]}
      />
    );
  }

  let largerOptionDiv = <></>;
  if (!get.useCustomBelt) {
    largerOptionDiv = (
      <>
        <Divider color="primary">Larger Belt</Divider>
        <Columns formColumns multiline>
          <Column fullhdPercentage={0.5} percentage={1}>
            <SingleInputLine label="Belt Teeth" id="largerBeltTeeth" for="id">
              <NumericOutput
                stateHook={[largerTeeth, setLargerTeeth]}
                roundTo={0}
              />
            </SingleInputLine>
          </Column>
          <Column fullhdPercentage={0.5} percentage={1}>
            <SingleInputLine
              label="Center Distance"
              id="largerCenter"
              for="numeric"
            >
              <MeasurementOutput
                stateHook={[largerCenter, setLargerCenter]}
                numberRoundTo={4}
                defaultUnit="in"
              />
            </SingleInputLine>
          </Column>
        </Columns>

        <Columns formColumns multiline>
          <Column>
            <SingleInputLine
              label="Pulley 1 Teeth in Mesh"
              id="largerP1TeethInMesh"
              for="id"
              tooltip="The number of teeth that the belt has engaged with Pulley 1."
            >
              <NumericOutput
                stateHook={[p1LargeMesh, setP1LargeMesh]}
                roundTo={1}
              />
            </SingleInputLine>
          </Column>
          <Column>
            <SingleInputLine
              label="Pulley 2 Teeth in Mesh"
              id="largerP2TeethInMesh"
              for="id"
              tooltip="The number of teeth that the belt has engaged with Pulley 2."
            >
              <NumericOutput
                stateHook={[p2LargeMesh, setP2LargeMesh]}
                roundTo={1}
              />
            </SingleInputLine>
          </Column>
        </Columns>

        <SingleInputLine
          label="Gap between pulleys"
          tooltip="Does not account for flanges. Verify your flanges take up less space than this."
        >
          <MeasurementOutput
            stateHook={[largePulleyGap, setLargePulleyGap]}
            defaultUnit="in"
            numberRoundTo={2}
            dangerIf={() => largePulleyGap.lt(new Measurement(0, "in"))}
            warningIf={() => largePulleyGap.lt(new Measurement(3 / 16, "in"))}
          />
        </SingleInputLine>
      </>
    );
  }

  return (
    <>
      <SimpleHeading
        queryParams={BeltsParamsV1}
        state={get}
        title="Belt Calculator"
      />
      <Columns desktop centered>
        <Column>
          <Columns formColumns>
            <Column>
              <SingleInputLine
                label="Pitch"
                id="pitch"
                for="numeric"
                tooltip="Pitch of the belt."
              >
                <MeasurementInput stateHook={[get.pitch, set.setPitch]} />
              </SingleInputLine>
            </Column>
            <Column>
              <SingleInputLine
                label="Belt Tooth Increment"
                id="beltToothIncrement"
                for="id"
                tooltip="The multiple of belt teeth to check belt fits for."
              >
                <NumberInput
                  disabledIf={() => get.useCustomBelt}
                  stateHook={[get.toothIncrement, set.setToothIncrement]}
                />
              </SingleInputLine>
            </Column>
          </Columns>

          <Columns formColumns multiline>
            <Column>
              <SingleInputLine
                label="Target Center"
                id="desiredCenter"
                for="numeric"
                tooltip="Desired distance between the centers of each pulley."
              >
                <MeasurementInput
                  stateHook={[get.desiredCenter, set.setDesiredCenter]}
                  numberDisabledIf={() => get.useCustomBelt}
                />
              </SingleInputLine>
            </Column>
            <Column>
              <SingleInputLine
                label="Extra Center"
                id="extraCenter"
                for="numeric"
                tooltip="An extra distance applied after the C-C calculations to ensure snug belt fit."
              >
                <MeasurementInput
                  stateHook={[get.extraCenter, set.setExtraCenter]}
                />
              </SingleInputLine>
            </Column>
          </Columns>

          <Columns formColumns>
            <Column ofTwelve={6}>
              <SingleInputLine
                label="Use Specific Belt"
                for="id"
                id="enableCustomBelt"
                tooltip="Use when you already know the exact belt size you intend to use."
              >
                <BooleanInput
                  stateHook={[get.useCustomBelt, set.setUseCustomBelt]}
                  id="useCustomBelt"
                />
              </SingleInputLine>
            </Column>
            <Column>
              <SingleInputLine
                label="Specific Belt Teeth"
                for="id"
                id="specificBeltTeeth"
                tooltip="Size of the specific belt you want to use."
              >
                <NumberInput
                  stateHook={[get.customBeltTeeth, set.setCustomBeltTeeth]}
                  disabledIf={() => !get.useCustomBelt}
                  roundTo={0}
                />
              </SingleInputLine>
            </Column>
          </Columns>

          <Divider color="primary">Pulley 1</Divider>

          <Columns formColumns>
            <Column>
              <SingleInputLine label="Teeth" id="p1Teeth" for="id">
                <NumberInput stateHook={[get.p1Teeth, set.setP1Teeth]} />
              </SingleInputLine>
            </Column>
            <Column>
              <SingleInputLine
                label="PD"
                id="p1PitchDiameter"
                tooltip="Pitch Diameter"
              >
                <MeasurementOutput
                  stateHook={[p1pd, setP1PD]}
                  numberRoundTo={4}
                  defaultUnit="in"
                />
              </SingleInputLine>
            </Column>
          </Columns>

          <Divider color="primary">Pulley 2</Divider>

          <Columns formColumns>
            <Column>
              <SingleInputLine label="Teeth" id="p2Teeth" for="id">
                <NumberInput stateHook={[get.p2Teeth, set.setP2Teeth]} />
              </SingleInputLine>
            </Column>
            <Column>
              <SingleInputLine
                label="PD"
                id="p2PitchDiameter"
                tooltip="Pitch Diameter"
              >
                <MeasurementOutput
                  stateHook={[p2pd, setP2PD]}
                  numberRoundTo={4}
                  defaultUnit="in"
                />
              </SingleInputLine>
            </Column>
          </Columns>

          <Divider color="primary">
            {get.useCustomBelt ? "Custom" : "Smaller"} Belt
          </Divider>
          <Columns formColumns multiline>
            <Column fullhdPercentage={0.5} percentage={1}>
              <SingleInputLine
                label="Belt Teeth"
                id="smallerBeltTeeth"
                for="id"
              >
                <NumericOutput
                  stateHook={[smallerTeeth, setSmallerTeeth]}
                  roundTo={0}
                />
              </SingleInputLine>
            </Column>
            <Column fullhdPercentage={0.5} percentage={1}>
              <SingleInputLine
                label="Center Distance"
                id="smallerCenter"
                for="numeric"
              >
                <MeasurementOutput
                  stateHook={[smallerCenter, setSmallerCenter]}
                  numberRoundTo={4}
                  defaultUnit="in"
                />
              </SingleInputLine>
            </Column>
          </Columns>

          <Columns formColumns multiline>
            <Column>
              <SingleInputLine
                label="Pulley 1 Teeth in Mesh"
                id="smallerP1TeethInMesh"
                for="id"
                tooltip="The number of teeth that the belt has engaged with Pulley 1."
              >
                <NumericOutput
                  stateHook={[p1SmallMesh, setP1SmallMesh]}
                  roundTo={1}
                />
              </SingleInputLine>
            </Column>
            <Column>
              <SingleInputLine
                label="Pulley 2 Teeth in Mesh"
                id="smallerP2TeethInMesh"
                for="id"
                tooltip="The number of teeth that the belt has engaged with Pulley 2."
              >
                <NumericOutput
                  stateHook={[p2SmallMesh, setP2SmallMesh]}
                  roundTo={1}
                />
              </SingleInputLine>
            </Column>
          </Columns>

          <SingleInputLine
            label="Gap between pulleys"
            tooltip="Does not account for flanges. Verify your flanges take up less space than this."
          >
            <MeasurementOutput
              stateHook={[smallPulleyGap, setSmallPulleyGap]}
              defaultUnit="in"
              numberRoundTo={2}
              dangerIf={() => smallPulleyGap.lt(new Measurement(0, "in"))}
              warningIf={() => smallPulleyGap.lt(new Measurement(3 / 16, "in"))}
            />
          </SingleInputLine>

          {largerOptionDiv}
        </Column>
        <Column>
          <InventoryTable
            smallerTeeth={smallerTeeth}
            largerTeeth={get.useCustomBelt ? undefined : largerTeeth}
            pitch={get.pitch}
          />
          {cheatSheet}
        </Column>
      </Columns>

      {/* <Scene /> */}
    </>
  );
}
