import Heading from "common/components/calc-heading/Heading";
import ChainInput from "common/components/io/inputs/ChainInput";
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
import { NumberParam, StringParam } from "use-query-params";

import CheatSheet from "./CheatSheet";
import chains from "./index";
import { calculateClosestCenters, teethToPD } from "./math";
import { chainVersionManager } from "./versions";

export default function Chains() {
  setTitle(chains.title);

  // Parse URL params
  const {
    chain: chain_,
    p1Teeth: p1Teeth_,
    p2Teeth: p2Teeth_,
    desiredCenter: desiredCenter_,
    extraCenter: extraCenter_,
  } = queryStringToDefaults(
    window.location.search,
    {
      chain: StringParam,
      p1Teeth: NumberParam,
      p2Teeth: NumberParam,
      desiredCenter: Measurement.getParam(),
      extraCenter: Measurement.getParam(),
    },
    chains.initialState,
    chainVersionManager
  );

  // Inputs
  const [chain, setChain] = useState(chain_);
  const [p1Teeth, setP1Teeth] = useState(p1Teeth_);
  const [p2Teeth, setP2Teeth] = useState(p2Teeth_);
  const [desiredCenter, setDesiredCenter] = useState(desiredCenter_);
  const [extraCenter, setExtraCenter] = useState(extraCenter_);

  // Outputs
  const [p1Pitch, setP1Pitch] = useState(teethToPD(p1Teeth, chain, "in"));
  const [p2Pitch, setP2Pitch] = useState(teethToPD(p2Teeth, chain, "in"));

  const results = useMemo(
    () =>
      calculateClosestCenters(
        chain,
        p1Teeth,
        p2Teeth,
        desiredCenter,
        extraCenter
      ),
    [chain, p1Teeth, p2Teeth, desiredCenter, extraCenter]
  );

  const [smallerCenter, setSmallerCenter] = useState(results.smaller.distance);
  const [smallerTeeth, setSmallerTeeth] = useState(results.smaller.teeth);
  const [largerCenter, setLargerCenter] = useState(results.larger.distance);
  const [largerTeeth, setLargerTeeth] = useState(results.larger.teeth);

  useEffect(() => {
    setP1Pitch(teethToPD(p1Teeth, chain, p1Pitch.units()));
    setP2Pitch(teethToPD(p2Teeth, chain, p2Pitch.units()));
    setSmallerCenter(results.smaller.distance);
    setSmallerTeeth(results.smaller.teeth);
    setLargerCenter(results.larger.distance);
    setLargerTeeth(results.larger.teeth);
  }, [chain, p1Teeth, p2Teeth, desiredCenter, extraCenter]);

  return (
    <>
      <Heading
        title={chains.title}
        subtitle={`V${chains.version}`}
        getQuery={() => {
          return stateToQueryString([
            new QueryableParamHolder({ chain }, StringParam),
            new QueryableParamHolder({ p1Teeth }, NumberParam),
            new QueryableParamHolder({ p2Teeth }, NumberParam),
            new QueryableParamHolder({ desiredCenter }, Measurement.getParam()),
            new QueryableParamHolder({ extraCenter }, Measurement.getParam()),
            new QueryableParamHolder({ version: chains.version }, NumberParam),
          ]);
        }}
      />
      <div className="columns">
        <div className="column">
          <ChainInput stateHook={[chain, setChain]} />
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
              label="Links"
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
              label="Links"
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
