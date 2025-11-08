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
import { SimpleBelt } from "common/models/Belt";
import { StateHook } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import { SimplePulley } from "common/models/Pulley";
import { useGettersSetters } from "common/tooling/conversion";
import { useEffect, useState } from "react";
import { BeltsParamsV1, BeltsStateV1 } from "web/calculators/belts";
import InventoryTable from "web/calculators/belts/components/InventoryTable";
import { PulleyCheatSheet } from "web/calculators/belts/components/PulleyCheatSheet";
import { BeltState } from "web/calculators/belts/converter";
import {
  ClosestCentersResult,
  calculateClosestCenters,
  calculateDistance,
  calculateDistanceBetweenPulleys,
  teethInMesh,
} from "web/calculators/belts/math";

interface BeltOptionProps {
  title: string;
  idPrefix: string;
  teethHook: StateHook<number>;
  centerDistanceHook: StateHook<Measurement>;
  pulley1TeethMeshHook: StateHook<number>;
  pulley2TeethMeshHook: StateHook<number>;
  gapBetweenPulleysHook: StateHook<Measurement>;
  diffFromTargetHook: StateHook<Measurement>;
}

export default function BeltsCalculator(): JSX.Element {
  const [get, set] = useGettersSetters(BeltState.getState() as BeltsStateV1);

  const p1 = new SimplePulley(get.p1Teeth, get.pitch);
  const p2 = new SimplePulley(get.p2Teeth, get.pitch);

  const calculate = {
    p1PD: () => p1.pitchDiameter,
    p2PD: () => p2.pitchDiameter,
    smallerCenter: (res: ClosestCentersResult) => res.smaller.distance,
    smallerTeeth: (res: ClosestCentersResult) => res.smaller.belt.teeth,
    largerCenter: (res: ClosestCentersResult) => res.larger.distance,
    largerTeeth: (res: ClosestCentersResult) => res.larger.belt.teeth,
    p1SmallMesh: () =>
      teethInMesh(
        p1,
        p2,
        smallerCenter,
        p1,
      ),
    p2SmallMesh: () =>
      teethInMesh(
        p1,
        p2,
        smallerCenter,
        p2,
      ),
    p1LargeMesh: () =>
      teethInMesh(
        p1,
        p2,
        largerCenter,
        p1,
      ),
    p2LargeMesh: () =>
      teethInMesh(
        p1,
        p2,
        largerCenter,
        p2,
      ),
    smallDistanceBetweenPulleys: () =>
      calculateDistanceBetweenPulleys(
        p1,
        p2,
        smallerCenter,
      ),
    largeDistanceBetweenPulleys: () =>
      calculateDistanceBetweenPulleys(
        p1,
        p2,
        largerCenter,
      ),
  };

  const [p1pd, setP1PD] = useState(calculate.p1PD());
  const [p2pd, setP2PD] = useState(calculate.p2PD());

  const results = calculateClosestCenters(
    p1,
    p2,
    get.desiredCenter,
    get.toothIncrement,
  );

  const [smallerCenter, setSmallerCenter] = useState(
    calculate.smallerCenter(results),
  );
  const [smallerTeeth, setSmallerTeeth] = useState(
    calculate.smallerTeeth(results),
  );
  const [largerCenter, setLargerCenter] = useState(
    calculate.largerCenter(results),
  );
  const [largerTeeth, setLargerTeeth] = useState(
    calculate.largerTeeth(results),
  );

  const [p1SmallMesh, setP1SmallMesh] = useState(calculate.p1SmallMesh());
  const [p2SmallMesh, setP2SmallMesh] = useState(calculate.p2SmallMesh());
  const [p1LargeMesh, setP1LargeMesh] = useState(calculate.p1LargeMesh());
  const [p2LargeMesh, setP2LargeMesh] = useState(calculate.p2LargeMesh());
  const [smallPulleyGap, setSmallPulleyGap] = useState(
    calculate.smallDistanceBetweenPulleys(),
  );
  const [largePulleyGap, setLargePulleyGap] = useState(
    calculate.largeDistanceBetweenPulleys(),
  );

  const [smallDiffFromTarget, setSmallDiffFromTarget] = useState(
    smallerCenter.sub(get.desiredCenter.add(get.extraCenter)),
  );
  const [largeDiffFromTarget, setLargeDiffFromTarget] = useState(
    largerCenter.sub(get.desiredCenter.add(get.extraCenter)),
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
        p1,
        p2,
        new SimpleBelt(get.customBeltTeeth, get.pitch),
      );

      setSmallerCenter(dist.add(get.extraCenter).to(smallerCenter.units()));
      setSmallerTeeth(get.customBeltTeeth);
    } else {
      const results = calculateClosestCenters(
        p1,
        p2,
        get.desiredCenter,
        get.toothIncrement,
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

  useEffect(() => {
    setSmallDiffFromTarget(smallerCenter.sub(get.desiredCenter));
  }, [smallerCenter, get.desiredCenter]);

  useEffect(() => {
    setLargeDiffFromTarget(largerCenter.sub(get.desiredCenter));
  }, [largerCenter, get.desiredCenter]);

  function BeltOption(props: BeltOptionProps) {
    const {
      title,
      idPrefix,
      teethHook,
      centerDistanceHook,
      pulley1TeethMeshHook,
      pulley2TeethMeshHook,
      gapBetweenPulleysHook,
      diffFromTargetHook,
    } = props;

    return (
      <>
        <Divider color="primary">{title}</Divider>
        <Columns formColumns multiline>
          <Column fullhdPercentage={0.5} percentage={1}>
            <SingleInputLine
              label="Belt Teeth"
              id={`${idPrefix}BeltTeeth`}
              for="id"
            >
              <NumericOutput stateHook={teethHook} roundTo={0} />
            </SingleInputLine>
          </Column>
          <Column fullhdPercentage={0.5} percentage={1}>
            <SingleInputLine
              label="Center Distance"
              id={idPrefix + "Center"}
              for="numeric"
            >
              <MeasurementOutput
                stateHook={centerDistanceHook}
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
              id={idPrefix + "P1TeethInMesh"}
              for="id"
              tooltip="The number of teeth that the belt has engaged with Pulley 1."
            >
              <NumericOutput stateHook={pulley1TeethMeshHook} roundTo={1} />
            </SingleInputLine>
          </Column>
          <Column>
            <SingleInputLine
              label="Pulley 2 Teeth in Mesh"
              id={idPrefix + "P2TeethInMesh"}
              for="id"
              tooltip="The number of teeth that the belt has engaged with Pulley 2."
            >
              <NumericOutput stateHook={pulley2TeethMeshHook} roundTo={1} />
            </SingleInputLine>
          </Column>
        </Columns>

        <Columns formColumns multiline>
          <Column>
            <SingleInputLine
              id={idPrefix + "PulleyGap"}
              label="Gap between pulleys"
              tooltip="Gap between pulley pitch diameters. Does not account for flanges nor belt thickness. Verify your flanges take up less space than this."
            >
              <MeasurementOutput
                stateHook={gapBetweenPulleysHook}
                defaultUnit="in"
                numberRoundTo={2}
                dangerIf={() =>
                  gapBetweenPulleysHook[0].lt(new Measurement(0, "in"))
                }
                warningIf={() =>
                  gapBetweenPulleysHook[0].lt(new Measurement(3 / 16, "in"))
                }
              />
            </SingleInputLine>
          </Column>
          {get.useCustomBelt ? (
            <></>
          ) : (
            <Column>
              <SingleInputLine
                label="Difference from target"
                id={idPrefix + "DiffFromTarget"}
                for="id"
                tooltip="The difference between this belt's center distance, and the target center distance"
              >
                <MeasurementOutput
                  stateHook={diffFromTargetHook}
                  defaultUnit="in"
                  numberRoundTo={3}
                />
              </SingleInputLine>
            </Column>
          )}
        </Columns>
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
                  roundTo={0}
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
                  numberRoundTo={0}
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
          <BeltOption
            title={`${get.useCustomBelt ? "Custom" : "Smaller"} Belt`}
            idPrefix={"smaller"}
            teethHook={[smallerTeeth, setSmallerTeeth]}
            centerDistanceHook={[smallerCenter, setSmallerCenter]}
            pulley1TeethMeshHook={[p1SmallMesh, setP1SmallMesh]}
            pulley2TeethMeshHook={[p2SmallMesh, setP2SmallMesh]}
            gapBetweenPulleysHook={[smallPulleyGap, setSmallPulleyGap]}
            diffFromTargetHook={[smallDiffFromTarget, setSmallDiffFromTarget]}
          />
          {!get.useCustomBelt && (
            <BeltOption
              title={"Larger Belt"}
              idPrefix={"larger"}
              teethHook={[largerTeeth, setLargerTeeth]}
              centerDistanceHook={[largerCenter, setLargerCenter]}
              pulley1TeethMeshHook={[p1LargeMesh, setP1LargeMesh]}
              pulley2TeethMeshHook={[p2LargeMesh, setP2LargeMesh]}
              gapBetweenPulleysHook={[largePulleyGap, setLargePulleyGap]}
              diffFromTargetHook={[largeDiffFromTarget, setLargeDiffFromTarget]}
            />
          )}
        </Column>
        <Column>
          <InventoryTable
            smallerTeeth={smallerTeeth}
            largerTeeth={get.useCustomBelt ? undefined : largerTeeth}
            pitch={get.pitch}
          />

          <PulleyCheatSheet
            pitch={get.pitch}
            currentPulleys={[
              p1,
              p2,
            ]}
          />
        </Column>
      </Columns>

      {/* <Scene /> */}
    </>
  );
}
