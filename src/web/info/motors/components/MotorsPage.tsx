import Metadata from "common/components/Metadata";
import Graph from "common/components/graphing/Graph";
import { GraphConfig } from "common/components/graphing/graphConfig";
import Measurement from "common/models/Measurement";
import Motor, { solveMotorODE } from "common/models/Motor";
import { useEffect, useMemo } from "react";
import { MotorsReadme } from "web/calculators/readmes";
import motorsConfig from "web/info/motors";
import Playground from "./Playground";
import SpecTable from "./SpecTable";

export default function Motors(): JSX.Element {
  const J = new Measurement(0.0004, "kg m2");
  const B = new Measurement(0.00004, "N m s / rad");
  const L = new Measurement(0.000035, "H");
  const limit = new Measurement(40, "A");

  const duration = 1;
  const numStepsPerSec = 2000;
  const steps = duration * numStepsPerSec;
  const stepSize = 1 / numStepsPerSec;

  // const solver = new ODESolver(
  //   (t, y) => {
  //     const motor = Motor.NEOs(1);

  //     const prevVel = new Measurement(y[0], "rad/s");
  //     const prevCurrent = new Measurement(y[1], "A");
  //     const prevCurrLimit = new Measurement(y[2], "A");

  //     const currToUse = prevCurrent.gte(prevCurrLimit)
  //       ? prevCurrLimit
  //       : prevCurrent;
  //     const limited = prevCurrent.gte(prevCurrLimit);

  //     const newCurrentPerSec = nominalVoltage
  //       .sub(motor.resistance.mul(prevCurrent))
  //       .sub(motor.kV.inverse().mul(prevVel))
  //       .div(L);

  //     const newVelocityPerSec = motor.kT
  //       .mul(currToUse)
  //       .sub(B.mul(prevVel))
  //       .div(J)
  //       .mul(new Measurement(1, "rad"))
  //       .toBase();

  //     return [
  //       newVelocityPerSec.scalar === 0
  //         ? 0
  //         : newVelocityPerSec.to("rad/s2").scalar,
  //       newCurrentPerSec.to("A/s").scalar,
  //       limited ? 0 : newCurrentPerSec.to("A/s").scalar,
  //       prevVel.to("rad/s").scalar,
  //     ];
  //   },
  //   [0, 181, limit.scalar, 0],
  //   0,
  //   duration,
  // );

  // const data = useMemo(() => solver.rk4(steps), []);

  const data = useMemo(
    () =>
      solveMotorODE(Motor.NEOs(1), new Measurement(40, "A"), (info) => {
        // return info.stepNumber >= 1000;
        return info.position.gte(new Measurement(500, "rad"));
      }),
    [],
  );

  useEffect(() => {
    console.log(data.ys);
  }, []);

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
            data: data.ts.map((t, i) => ({ x: t, y: data.ys[i][2] })),
            borderColor: "red",
            fill: false,
            cubicInterpolationMode: "monotone",
            yAxisID: "curr",
          },
          {
            label: "pos",
            data: data.ts.map((t, i) => ({ x: t, y: data.ys[i][3] })),
            borderColor: "green",
            fill: false,
            cubicInterpolationMode: "monotone",
            yAxisID: "pos",
          },
        ]}
        title="ODE"
        height={1000}
      />
    </>
  );
}
