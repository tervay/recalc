import Qty from "js-quantities";
import { stringify } from "query-string";
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  encodeQueryParams,
  NumberParam,
  useQueryParams,
  withDefault,
} from "use-query-params";
import styles from "../../index.scss";
import { Line } from "../../rcjs/index";
import Hero from "../common/hero";
import { NumberInput, QtyInput, QtyOutput } from "../common/io";
import MotorSelect from "../common/motors";
import {
  MotorDictToObj,
  MotorParam,
  QtyParam,
  useDeepCompare,
} from "../common/params";
import {
  calculateWindupTimeReducer,
  generateWindupTimeChartReducer,
} from "./slice";

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
  const chart = useRef(null);

  // Prepare outputs
  const windupTime = useSelector((s) => s.flywheel.windupTime);
  const windupTimeChart = useSelector((s) => s.flywheel.windupTimeChart);

  // Update
  useEffect(() => {
    dispatch(calculateWindupTimeReducer(query));
    dispatch(generateWindupTimeChartReducer(query));
    if (chart.current && chart.current.chartInstance) {
      chart.current.chartInstance.update();
    }
  }, useDeepCompare([{ ...query }]));

  return (
    <div>
      <Hero
        title="Flywheel Calculator"
        query={stringify(
          encodeQueryParams(
            {
              motor: MotorParam,
              ratio: NumberParam,
              targetSpeed: QtyParam,
              radius: QtyParam,
              weight: QtyParam,
            },
            query
          )
        )}
      />
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
        <div className="column">
          <Line
            data={{
              datasets: [
                {
                  data: windupTimeChart.data,
                  cubicInterpolationMode: "monotone",
                  fill: false,
                  borderColor: styles.primary,
                },
              ],
            }}
            options={windupTimeChart.options}
            ref={chart}
          />
        </div>
      </div>
    </div>
  );
}
