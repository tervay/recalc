import Heading from "common/components/calc-heading/Heading";
import MultiInputLine from "common/components/io/inputs/MultiInputLine";
import { LabeledNumberInput } from "common/components/io/inputs/NumberInput";
import { LabeledQtyInput } from "common/components/io/inputs/QtyInput";
import { LabeledNumberOutput } from "common/components/io/outputs/NumberOutput";
import { LabeledQtyOutput } from "common/components/io/outputs/QtyOutput";
import {
  NumberParam,
  QtyParam,
  QueryableParamHolder,
  stateToQueryString,
} from "common/tooling/query-strings";
import Qty from "js-quantities";
import React, { useEffect, useMemo, useState } from "react";
import CheatSheet from "./CheatSheet";
import { calculateClosestCenters, teethToPD } from "./math";

export default function Belts() {
  // Inputs
  const [pitch, setPitch] = useState(Qty(3, "mm"));
  const [p1Teeth, setP1Teeth] = useState(24);
  const [p2Teeth, setP2Teeth] = useState(16);
  const [desiredCenter, setDesiredCenter] = useState(Qty(5, "in"));
  const [extraCenter, setExtraCenter] = useState(Qty(0, "in"));

  // Outputs
  const [p1Pitch, setP1Pitch] = useState(teethToPD(p1Teeth, pitch, "in"));
  const [p2Pitch, setP2Pitch] = useState(teethToPD(p2Teeth, pitch, "in"));

  const results = useMemo(
    () =>
      calculateClosestCenters(
        pitch,
        p1Pitch,
        p2Pitch,
        desiredCenter,
        extraCenter,
        15,
        200,
        5
      ),
    [pitch, p1Teeth, p2Teeth, desiredCenter, extraCenter]
  );

  const [smallerCenter, setSmallerCenter] = useState(results.smaller.distance);
  const [smallerTeeth, setSmallerTeeth] = useState(results.smaller.teeth);
  const [largerCenter, setLargerCenter] = useState(results.larger.distance);
  const [largerTeeth, setLargerTeeth] = useState(results.larger.teeth);

  useEffect(() => {
    setP1Pitch(teethToPD(p1Teeth, pitch, p1Pitch.units()));
    setP2Pitch(teethToPD(p2Teeth, pitch, p2Pitch.units()));
    setSmallerCenter(results.smaller.distance);
    setSmallerTeeth(results.smaller.teeth);
    setLargerCenter(results.larger.distance);
    setLargerTeeth(results.larger.teeth);
  }, [pitch, p1Teeth, p2Teeth, desiredCenter, extraCenter]);

  return (
    <>
      <Heading
        title="Belt calculator"
        getQuery={() => {
          return stateToQueryString([
            new QueryableParamHolder({ pitch }, QtyParam),
            new QueryableParamHolder({ p1Teeth }, NumberParam),
            new QueryableParamHolder({ p2Teeth }, NumberParam),
            new QueryableParamHolder({ desiredCenter }, QtyParam),
            new QueryableParamHolder({ extraCenter }, QtyParam),
          ]);
        }}
      />
      <div className="columns">
        <div className="column">
          <LabeledQtyInput
            label={"Pitch"}
            stateHook={[pitch, setPitch]}
            choices={["mm"]}
          />
          <LabeledQtyInput
            label="Desired Center"
            stateHook={[desiredCenter, setDesiredCenter]}
            choices={["in", "mm", "cm"]}
          />
          <LabeledQtyInput
            label="Extra Center"
            stateHook={[extraCenter, setExtraCenter]}
            choices={["in", "mm", "cm"]}
          />
          <MultiInputLine label={"Pulley 1"}>
            <LabeledNumberInput
              stateHook={[p1Teeth, setP1Teeth]}
              label="Teeth"
            />
            <LabeledQtyOutput
              label="PD"
              stateHook={[p1Pitch, setP1Pitch]}
              choices={["in", "mm", "cm"]}
              precision={4}
            />
          </MultiInputLine>
          <MultiInputLine label={"Pulley 2"}>
            <LabeledNumberInput
              stateHook={[p2Teeth, setP2Teeth]}
              label="Teeth"
            />
            <LabeledQtyOutput
              label="PD"
              stateHook={[p2Pitch, setP2Pitch]}
              choices={["in", "mm", "cm"]}
              precision={4}
            />
          </MultiInputLine>
          <MultiInputLine label="Smaller">
            <LabeledQtyOutput
              stateHook={[smallerCenter, setSmallerCenter]}
              label="Center"
              choices={["in", "mm", "cm"]}
              precision={4}
            />
            <LabeledNumberOutput
              stateHook={[smallerTeeth, setSmallerTeeth]}
              label="Teeth"
            />
          </MultiInputLine>
          <MultiInputLine label="Larger">
            <LabeledQtyOutput
              stateHook={[largerCenter, setLargerCenter]}
              label="Center"
              choices={["in", "mm", "cm"]}
              precision={4}
            />
            <LabeledNumberOutput
              stateHook={[largerTeeth, setLargerTeeth]}
              label="Teeth"
            />
          </MultiInputLine>
        </div>
        <div className="column">
          <CheatSheet />
        </div>
      </div>
    </>
  );
}
