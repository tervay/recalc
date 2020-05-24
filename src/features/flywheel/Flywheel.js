import Qty from "js-quantities";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NumberParam, useQueryParams, withDefault } from "use-query-params";
import Hero from "../common/hero";
import { NumberInput, QtyInput, QtyOutput } from "../common/io";
import MotorSelect from "../common/motors";
import {
  MotorDictToObj,
  MotorParam,
  QtyParam,
  useDeepCompare,
} from "../common/params";
import { calculateWindupTimeReducer } from "./slice";

export default function Flywheel() {
  // Prepare inputs
  const dispatch = useDispatch();
  const [query, setQuery] = useQueryParams({
    motor: withDefault(MotorParam, MotorDictToObj("Falcon 500", 1)),
    ratio: withDefault(NumberParam, 1),
    targetSpeed: withDefault(QtyParam, Qty(1000, "rpm")),
    radius: withDefault(QtyParam, Qty(2, "in")),
    weight: withDefault(QtyParam, Qty(5, "lb")),
  });

  // Prepare outputs
  const windupTime = useSelector((s) => s.flywheel.windupTime);

  // Update
  useEffect(() => {
    dispatch(calculateWindupTimeReducer(query));
  }, useDeepCompare([{ ...query }]));

  return (
    <div>
      <Hero title="Flywheel Calculator" />
      <div className="columns">
        <div className="column">
          <MotorSelect name="motor" setQuery={setQuery} motor={query.motor} />
          <NumberInput
            name="ratio"
            number={query.ratio}
            label="Gear reduction"
            setQuery={setQuery}
          />
          <QtyInput
            name="targetSpeed"
            label="Target Speed"
            qty={query.targetSpeed}
            setQuery={setQuery}
            choices={["rpm"]}
            redIf={() => {
              const motorMaxSpeed = query.motor.motor.freeSpeed.to("rpm")
                .scalar;
              const outputMaxSpeed = query.targetSpeed.to("rpm").scalar;
              const reduction = query.ratio;
              return outputMaxSpeed > motorMaxSpeed / reduction;
            }}
          />
          <QtyInput
            name="radius"
            label="Wheel Radius"
            qty={query.radius}
            setQuery={setQuery}
            choices={["in", "cm"]}
          />
          <QtyInput
            name="weight"
            label="Wheel Weight"
            qty={query.weight}
            setQuery={setQuery}
            choices={["lb", "kg"]}
          />
          <QtyOutput
            label="Windup Time"
            qty={windupTime}
            choices={["s"]}
            precision={3}
          />
        </div>
        <div className="column">graph soon</div>
      </div>
    </div>
  );
}
