import Heading from "common/components/calc-heading/Heading";
import MultiInputLine from "common/components/io/inputs/MultiInputLine";
import { LabeledNumberInput } from "common/components/io/inputs/NumberInput";
import { LabeledQtyInput } from "common/components/io/inputs/QtyInput";
import { LabeledNumberOutput } from "common/components/io/outputs/NumberOutput";
import { LabeledQtyOutput } from "common/components/io/outputs/QtyOutput";
import Measurement from "common/models/Measurement";
import {
  QueryableParamHolder,
  queryStringToDefaults,
  stateToQueryString,
} from "common/tooling/query-strings";
import { setTitle } from "common/tooling/routing";
import React, { useEffect, useMemo, useState } from "react";
import { NumberParam } from "use-query-params";

import beltData from "./beltData.json";
import CheatSheet from "./CheatSheet";
import belts from "./index";
import LinkGenerator from "./linkGenerator";
import { calculateClosestCenters, teethToPD } from "./math";
import { beltVersionManager } from "./versions";

export default function Belts() {
  setTitle(belts.title);

  // Parse URL params
  const {
    pitch: pitch_,
    p1Teeth: p1Teeth_,
    p2Teeth: p2Teeth_,
    desiredCenter: desiredCenter_,
    extraCenter: extraCenter_,
    toothIncrement: toothIncrement_,
    toothMax: toothMax_,
  } = queryStringToDefaults(
    window.location.search,
    {
      pitch: Measurement.getParam(),
      p1Teeth: NumberParam,
      p2Teeth: NumberParam,
      desiredCenter: Measurement.getParam(),
      extraCenter: Measurement.getParam(),
      toothIncrement: NumberParam,
      toothMax: NumberParam,
    },
    belts.initialState,
    beltVersionManager
  );

  // Inputs
  const [pitch, setPitch] = useState(pitch_.to("mm"));
  const [p1Teeth, setP1Teeth] = useState(p1Teeth_);
  const [p2Teeth, setP2Teeth] = useState(p2Teeth_);
  const [desiredCenter, setDesiredCenter] = useState(desiredCenter_);
  const [extraCenter, setExtraCenter] = useState(extraCenter_);
  const [toothIncrement, setToothIncrement] = useState(toothIncrement_);
  const [toothMax, setToothMax] = useState(toothMax_);

  // Outputs
  const [p1Pitch, setP1Pitch] = useState(teethToPD(p1Teeth, pitch).to("in"));
  const [p2Pitch, setP2Pitch] = useState(teethToPD(p2Teeth, pitch).to("in"));

  const results = useMemo(() => {
    return calculateClosestCenters(
      pitch,
      teethToPD(p1Teeth, pitch),
      teethToPD(p2Teeth, pitch),
      desiredCenter,
      extraCenter,
      toothIncrement * Math.ceil(15 / toothIncrement),
      Number(toothMax),
      Number(toothIncrement)
    );
  }, [
    pitch,
    p1Teeth,
    p2Teeth,
    desiredCenter,
    extraCenter,
    toothIncrement,
    toothMax,
  ]);

  const [smallerCenter, setSmallerCenter] = useState(results.smaller.distance);
  const [smallerTeeth, setSmallerTeeth] = useState(results.smaller.teeth);
  const [largerCenter, setLargerCenter] = useState(results.larger.distance);
  const [largerTeeth, setLargerTeeth] = useState(results.larger.teeth);

  useEffect(() => {
    setP1Pitch(teethToPD(p1Teeth, pitch));
    setP2Pitch(teethToPD(p2Teeth, pitch));
    setSmallerCenter(results.smaller.distance);
    setSmallerTeeth(results.smaller.teeth);
    setLargerCenter(results.larger.distance);
    setLargerTeeth(results.larger.teeth);
  }, [
    pitch,
    p1Teeth,
    p2Teeth,
    desiredCenter,
    extraCenter,
    toothIncrement,
    toothMax,
  ]);

  return (
    <>
      <Heading
        title={belts.title}
        subtitle={`V${belts.version}`}
        getQuery={() => {
          return stateToQueryString([
            new QueryableParamHolder({ pitch }, Measurement.getParam()),
            new QueryableParamHolder({ p1Teeth }, NumberParam),
            new QueryableParamHolder({ p2Teeth }, NumberParam),
            new QueryableParamHolder({ toothIncrement }, NumberParam),
            new QueryableParamHolder({ toothMax }, NumberParam),
            new QueryableParamHolder({ desiredCenter }, Measurement.getParam()),
            new QueryableParamHolder({ extraCenter }, Measurement.getParam()),
            new QueryableParamHolder({ version: belts.version }, NumberParam),
          ]);
        }}
      />
      <div className="columns">
        <div className="column">
          <LabeledQtyInput
            label={"Pitch"}
            stateHook={[pitch, setPitch]}
            choices={["mm"]}
            inputId={"pitch-input"}
            selectId={"pitch-select"}
          />
          <LabeledQtyInput
            label="Desired Center"
            stateHook={[desiredCenter, setDesiredCenter]}
            choices={["in", "mm", "cm"]}
            inputId={"desired-center-input"}
            selectId={"desired-center-select"}
          />
          <LabeledQtyInput
            label="Extra Center"
            stateHook={[extraCenter, setExtraCenter]}
            choices={["in", "mm", "cm"]}
            inputId={"extra-center-input"}
            selectId={"extra-center-select"}
          />
          <MultiInputLine label={"Pulley 1"}>
            <LabeledNumberInput
              stateHook={[p1Teeth, setP1Teeth]}
              label="Teeth"
              inputId="p1Teeth-input"
            />
            <LabeledQtyOutput
              label="PD"
              stateHook={[p1Pitch, setP1Pitch]}
              choices={["in", "mm", "cm"]}
              precision={4}
              inputId="p1Pitch-input"
              selectId="p1Pitch-select"
            />
          </MultiInputLine>
          <MultiInputLine label={"Pulley 2"}>
            <LabeledNumberInput
              stateHook={[p2Teeth, setP2Teeth]}
              label="Teeth"
              inputId="p2Teeth-input"
            />
            <LabeledQtyOutput
              label="PD"
              stateHook={[p2Pitch, setP2Pitch]}
              choices={["in", "mm", "cm"]}
              precision={4}
              inputId="p2Pitch-input"
              selectId="p2Pitch-select"
            />
          </MultiInputLine>
          <MultiInputLine label="Smaller">
            <LabeledQtyOutput
              stateHook={[smallerCenter, setSmallerCenter]}
              label="Center"
              choices={["in", "mm", "cm"]}
              precision={4}
              inputId="smaller-input"
              selectId="smaller-select"
            />
            <LabeledNumberOutput
              stateHook={[smallerTeeth, setSmallerTeeth]}
              label="Teeth"
              inputId="smaller-output"
            />
          </MultiInputLine>
          <MultiInputLine label="Larger">
            <LabeledQtyOutput
              stateHook={[largerCenter, setLargerCenter]}
              label="Center"
              choices={["in", "mm", "cm"]}
              precision={4}
              inputId="larger-input"
              selectId="larger-select"
            />
            <LabeledNumberOutput
              stateHook={[largerTeeth, setLargerTeeth]}
              label="Teeth"
              inputId="larger-output"
            />
          </MultiInputLine>
          <LabeledNumberInput
            stateHook={[toothIncrement, setToothIncrement]}
            label="Belt tooth increment"
            inputId="tooth-increment"
          />
          <LabeledNumberInput
            stateHook={[toothMax, setToothMax]}
            label="Belt tooth maximum"
            inputId="tooth-max"
          />
          <LinkGenerator
            smallBelt={smallerTeeth}
            largeBelt={largerTeeth}
            pitch={pitch}
            data={beltData}
          />
        </div>
        <div className="column">
          <CheatSheet />
        </div>
      </div>
    </>
  );
}
