import Heading from "common/components/calc-heading/Heading";
import { LabeledQtyInput } from "common/components/io/inputs/QtyInput";
import { LabeledNumberOutput } from "common/components/io/outputs/NumberOutput";
import { LabeledQtyOutput } from "common/components/io/outputs/QtyOutput";
import {
  QtyParam,
  QueryableParamHolder,
  queryStringToDefaults,
  stateToQueryString,
} from "common/tooling/query-strings";
import { setTitle } from "common/tooling/routing";
import { defaultAssignment } from "common/tooling/versions";
import Qty from "js-quantities";
import React, { useEffect, useState } from "react";

function calcOutputs(weight, sledWeight) {
  const numSpots = Math.ceil(
    weight.add(sledWeight).div(30.9).to(weight.units()).scalar
  );
  return { numSpots: numSpots, cost: Qty(numSpots * 75000, "USD") };
}

export default function Spot() {
  setTitle("Spot Calculator");

  // Parse URL params
  const { weight: weight_, sledWeight: sledWeight_ } = queryStringToDefaults(
    window.location.search,
    {
      weight: QtyParam,
      sledWeight: QtyParam,
    },
    {
      weight: Qty(100, "lb"),
      sledWeight: Qty(10, "lb"),
    },
    defaultAssignment
  );

  // Inputs
  const [weight, setWeight] = useState(weight_);
  const [sledWeight, setSledWeight] = useState(sledWeight_);

  // Outputs
  const [numSpots, setNumSpots] = useState(0);
  const [cost, setCost] = useState(Qty(0, "USD"));

  useEffect(() => {
    const outs = calcOutputs(weight, sledWeight);
    setNumSpots(outs.numSpots);
    setCost(outs.cost);
  }, [weight, sledWeight]);

  return (
    <>
      <Heading
        title={"Spot calculator"}
        getQuery={() => {
          return stateToQueryString([
            new QueryableParamHolder({ weight }, QtyParam),
            new QueryableParamHolder({ sledWeight }, QtyParam),
          ]);
        }}
      />
      <div className="columns">
        <div className="column">
          <LabeledQtyInput
            label={"Weight"}
            stateHook={[weight, setWeight]}
            choices={["lb", "kg"]}
            inputId={"weight-input"}
            selectId={"weight-select"}
          />
          <LabeledQtyInput
            label={"Sled Weight"}
            stateHook={[sledWeight, setSledWeight]}
            choices={["lb", "kg"]}
            inputId={"sled-weight-input"}
            selectId={"sled-weight-select"}
          />
          <LabeledNumberOutput
            label={"# of Spots required"}
            stateHook={[numSpots, setNumSpots]}
          />
          <LabeledQtyOutput
            label={"Cost"}
            stateHook={[cost, setCost]}
            choices={["USD"]}
            precision={2}
          />
        </div>
      </div>
    </>
  );
}
