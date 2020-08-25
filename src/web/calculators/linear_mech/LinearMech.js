import Heading from "common/components/calc-heading/Heading";
import { LabeledMotorInput } from "common/components/io/inputs/MotorInput";
import { LabeledNumberInput } from "common/components/io/inputs/NumberInput";
import { LabeledQtyInput } from "common/components/io/inputs/QtyInput";
import { LabeledRatioInput } from "common/components/io/inputs/RatioInput";
import { LabeledQtyOutput } from "common/components/io/outputs/QtyOutput";
import { Motor } from "common/tooling/motors";
import {
  MotorParam,
  NumberParam,
  QtyParam,
  QueryableParamHolder,
  queryStringToDefaults,
  RATIO_REDUCTION,
  RatioParam,
  stateToQueryString,
} from "common/tooling/query-strings";
import { setTitle } from "common/tooling/routing";
import Qty from "js-quantities";
import React, { useEffect, useState } from "react";

import { TITLE as title, VERSION as version } from "./config";
import {
  calculateCurrentDraw,
  CalculateLoadedSpeed,
  CalculateTimeToGoal,
  CalculateUnloadedSpeed,
} from "./math";
import { linearVersionManager } from "./versions";

export default function LinearMech() {
  setTitle(title);

  const {
    motor: motor_,
    travelDistance: travelDistance_,
    spoolDiameter: spoolDiameter_,
    load: load_,
    ratio: ratio_,
    efficiency: efficiency_,
  } = queryStringToDefaults(
    window.location.search,
    {
      motor: MotorParam,
      travelDistance: QtyParam,
      spoolDiameter: QtyParam,
      load: QtyParam,
      ratio: RatioParam,
      efficiency: NumberParam,
    },
    {
      motor: new Motor(1, "Falcon 500"),
      travelDistance: Qty(40, "in"),
      spoolDiameter: Qty(1, "in"),
      load: Qty(120, "lb"),
      ratio: {
        amount: 2,
        type: RATIO_REDUCTION,
      },
      efficiency: 100,
    },
    linearVersionManager
  );

  // inputs
  const [motor, setMotor] = useState(motor_);
  const [travelDistance, setTravelDistance] = useState(travelDistance_);
  const [spoolDiameter, setSpoolDiameter] = useState(spoolDiameter_);
  const [load, setLoad] = useState(load_);
  const [ratio, setRatio] = useState(ratio_);
  const [efficiency, setEfficiency] = useState(efficiency_);

  // Outputs
  const [unloadedSpeed, setUnloadedSpeed] = useState(Qty(0, "ft/s"));
  const [loadedSpeed, setLoadedSpeed] = useState(Qty(0, "ft/s"));
  const [timeToGoal, setTimeToGoal] = useState(Qty(0, "s"));
  const [currentDraw, setCurrentDraw] = useState(Qty(0, "A"));

  useEffect(() => {
    setUnloadedSpeed(CalculateUnloadedSpeed(motor, spoolDiameter, ratio));

    const loadedSpeed_ = CalculateLoadedSpeed(
      motor,
      spoolDiameter,
      load,
      ratio,
      efficiency
    );
    setLoadedSpeed(loadedSpeed_);
    setTimeToGoal(CalculateTimeToGoal(travelDistance, loadedSpeed_));

    setCurrentDraw(calculateCurrentDraw(motor, spoolDiameter, load, ratio));
  }, [motor, travelDistance, spoolDiameter, load, ratio, efficiency]);

  return (
    <>
      <Heading
        title={title}
        subtitle={`V${version}`}
        getQuery={() => {
          return stateToQueryString([
            new QueryableParamHolder({ motor }, MotorParam),
            new QueryableParamHolder({ travelDistance }, QtyParam),
            new QueryableParamHolder({ spoolDiameter }, QtyParam),
            new QueryableParamHolder({ load }, QtyParam),
            new QueryableParamHolder({ ratio }, RatioParam),
            new QueryableParamHolder({ efficiency }, NumberParam),
            new QueryableParamHolder({ version }, NumberParam),
          ]);
        }}
      />

      <div className="columns">
        <div className="column">
          <LabeledMotorInput
            label="Motors"
            stateHook={[motor, setMotor]}
            choices={Motor.choices}
          />
          <LabeledQtyInput
            label="Travel distance"
            stateHook={[travelDistance, setTravelDistance]}
            choices={["in", "ft", "cm", "m"]}
          />
          <LabeledQtyInput
            label="Spool diameter"
            stateHook={[spoolDiameter, setSpoolDiameter]}
            choices={["in", "cm"]}
          />
          <LabeledQtyInput
            label="Load"
            stateHook={[load, setLoad]}
            choices={["lb", "kg", "g"]}
          />
          <LabeledRatioInput label="Ratio" stateHook={[ratio, setRatio]} />
          <LabeledNumberInput
            label="Efficiency (%)"
            stateHook={[efficiency, setEfficiency]}
          />

          <LabeledQtyOutput
            label="Unloaded Speed"
            stateHook={[unloadedSpeed, setUnloadedSpeed]}
            choices={["ft/s", "m/s", "mi/hour", "km/hour"]}
            precision={2}
          />

          <LabeledQtyOutput
            label="Loaded Speed"
            stateHook={[loadedSpeed, setLoadedSpeed]}
            choices={["ft/s", "m/s", "mi/hour", "km/hour"]}
            precision={2}
          />

          <LabeledQtyOutput
            label="Time to goal"
            stateHook={[timeToGoal, setTimeToGoal]}
            choices={["s"]}
            precision={3}
          />
          <LabeledQtyOutput
            label="Current draw"
            stateHook={[currentDraw, setCurrentDraw]}
            choices={["A"]}
            precision={3}
          />
        </div>
        <div className="column">chart</div>
      </div>
    </>
  );
}
