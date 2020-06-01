import Qty from "js-quantities";
import React, { useEffect, useState } from "react";
import { LabeledMotorInput } from "../../common/components/io/inputs/MotorInput";
import { LabeledNumberInput } from "../../common/components/io/inputs/NumberInput";
import { LabeledQtyInput } from "../../common/components/io/inputs/QtyInput";
import { LabeledQtyOutput } from "../../common/components/io/outputs/QtyOutput";
import { motorMap } from "../../common/tooling/motors";
import { calculateWindupTime } from "./math";

export default function Flywheel(props) {
  // Inputs
  const [motor, setMotor] = useState({
    number: 1,
    data: motorMap["Falcon 500"],
  });
  const [ratio, setRatio] = useState(1);
  const [radius, setRadius] = useState(Qty(2, "in"));
  const [targetSpeed, setTargetSpeed] = useState(Qty(2000, "rpm"));
  const [weight, setWeight] = useState(Qty(5, "lb"));

  // Outputs
  const [windupTime, setWindupTime] = useState(Qty(0, "s"));

  useEffect(() => {
    setWindupTime(
      calculateWindupTime(
        weight,
        radius,
        motor.data.freeSpeed,
        motor.data.stallTorque,
        motor.data.stallCurrent,
        motor.data.resistance,
        motor.number,
        ratio,
        targetSpeed
      )
    );
  }, [motor, ratio, radius, targetSpeed, weight]);

  return (
    <div className="columns">
      <div className="column">
        <LabeledMotorInput
          label={"Motors"}
          stateHook={[motor, setMotor]}
          choices={["Falcon 500", "CIM"]}
        />
        <LabeledNumberInput stateHook={[ratio, setRatio]} label="Ratio" />
        <LabeledQtyInput
          stateHook={[targetSpeed, setTargetSpeed]}
          choices={["rpm"]}
          label={"Target Speed"}
        />
        <LabeledQtyInput
          stateHook={[radius, setRadius]}
          choices={["in", "cm"]}
          label={"Radius"}
        />
        <LabeledQtyInput
          stateHook={[weight, setWeight]}
          choices={["lb", "kg", "g"]}
          label={"Weight"}
        />
        <LabeledQtyOutput
          stateHook={[windupTime, setWindupTime]}
          choices={["s"]}
          label={"Windup Time"}
        />
      </div>
      <div className="column">Chart</div>
    </div>
  );
}
