import Metadata from "common/components/Metadata";
import Graph from "common/components/graphing/Graph";
import { GraphConfig } from "common/components/graphing/graphConfig";
import Measurement from "common/models/Measurement";
import Motor, { nominalVoltage } from "common/models/Motor";
import ODESolver from "common/tooling/ODE";
import { useMemo } from "react";
import { MotorsReadme } from "web/calculators/readmes";
import motorsConfig from "web/info/motors";
import Playground from "./Playground";
import SpecTable from "./SpecTable";

export default function Motors(): JSX.Element {
  const J = new Measurement(0.0001, "kg m2");
  const B = new Measurement(0.0001, "N m s / rad");
  const L = new Measurement(0.02, "H");

  const solver = new ODESolver(
    (t, y) => {
      const motor = Motor.NEOs(1);

      const prevVel = new Measurement(y[0], "rad/s");
      const prevCurrent = new Measurement(y[1], "A");

      const newCurrentPerSec = nominalVoltage
        .sub(motor.resistance.mul(prevCurrent))
        .sub(motor.kV.inverse().mul(prevVel))
        .div(L);

      const newVelocityPerSec = motor.kT
        .mul(prevCurrent)
        .sub(B.mul(prevVel))
        .div(J)
        .mul(new Measurement(1, "rad"))
        .toBase();

      return [
        newVelocityPerSec.scalar === 0
          ? 0
          : newVelocityPerSec.to("rad/s2").scalar,
        newCurrentPerSec.to("A/s").scalar,
      ];
    },
    [0, 181],
    0,
    1,
  );

  const data = useMemo(() => solver.rk4(1000), []);

  return (
    <>
      <Metadata pageConfig={motorsConfig} />
      <SpecTable />
      <Playground />
      <MotorsReadme />
      <Graph
        id="ode"
        options={GraphConfig.options({
          rpm: {
            type: "linear",
            title: {
              display: true,
              text: "Velo (rad/s)",
            },
            min: -1000,
            max: 3000,
            position: "left",
          },
          curr: {
            type: "linear",
            title: {
              display: true,
              text: "Current (A)",
            },
            min: -200,
            max: 200,
            position: "right",
          },
          x: {
            type: "linear",
            title: {
              display: true,
              text: "Time (s)",
            },
            min: 0,
          },
        })}
        simpleDatasets={[
          {
            label: "rad/s",
            data: data.ts.map((t, i) => ({ x: t, y: data.ys[i][0] })),
            borderColor: "blue",
            fill: false,
            cubicInterpolationMode: "monotone",
            yAxisID: "rpm",
          },
          {
            label: "curr",
            data: data.ts.map((t, i) => ({ x: t, y: data.ys[i][1] })),
            borderColor: "red",
            fill: false,
            cubicInterpolationMode: "monotone",
            yAxisID: "curr",
          },
        ]}
        title="ODE"
        height={1000}
      />
    </>
  );
}
