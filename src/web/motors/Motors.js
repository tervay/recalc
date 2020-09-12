import Table from "common/components/Table";
import Motor from "common/models/Motor";
import { setTitle } from "common/tooling/routing";
import React from "react";

import motorsConfig from "./index";

export default function Motors() {
  setTitle(motorsConfig.title);

  const data = React.useMemo(
    () =>
      Motor.getAllMotors().map((m) => ({
        link: <a href={m.url}>{m.name}</a>,
        freeSpeed: m.freeSpeed.to("rpm").scalar,
        freeCurrent: m.freeCurrent.to("A").scalar.toFixed(1),
        stallTorque: m.stallTorque.to("N m").scalar.toFixed(2),
        stallCurrent: m.stallCurrent.to("A").scalar,
        power: m.power.to("W").scalar.toFixed(2),
        resistance: m.resistance.to("ohm").scalar.toFixed(3),
        weight: m.weight.to("lb").scalar.toFixed(2),
        powerToWeight: m.power.div(m.weight).to("W/lb").scalar.toFixed(1),
      })),
    []
  );
  const columns = React.useMemo(
    () => [
      {
        Header: "Name",
        accessor: "link",
      },
      {
        Header: "Free Speed (RPM)",
        accessor: "freeSpeed",
      },
      {
        Header: "Stall Torque (N-m)",
        accessor: "stallTorque",
      },
      {
        Header: "Stall Current (A)",
        accessor: "stallCurrent",
      },
      {
        Header: "Free Current (A)",
        accessor: "freeCurrent",
      },
      {
        Header: "Power (W)",
        accessor: "power",
      },
      {
        Header: "Resistance (Ω)",
        accessor: "resistance",
      },
      {
        Header: "Weight (lb)",
        accessor: "weight",
      },
      {
        Header: "Power:Weight ratio (W/lb)",
        accessor: "powerToWeight",
      },
    ],
    []
  );

  return (
    <>
      <Table columns={columns} data={data} />
      <section className="section">
        <div className="container">
          <div className="title">Explaining these numbers</div>
          <p>
            VEX has a great introduction to DC motors specs{" "}
            <a href={"https://motors.vex.com/introduction"}>here</a>.
          </p>
          <br />
          <br />
          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Stall_torque"}>
              Stall torque
            </a>
          </div>
          <p>
            How much torque (rotational force) the motor outputs when the shaft
            is locked to zero RPM (which is known as stall).
          </p>
          <br />
          <br />
          <div className="title">Stall current</div>
          <p>
            How much current the motor draws when at stall. Note that there are
            further limitations on current draw implemented in the FRC control
            system, such as PDP breakers or software-implemented current limits.
          </p>
          <br />
          <br />
          <div className="title">Free Current</div>
          <p>
            How much current the motor draws when spinning freely at maximum RPM
            under no external load.
          </p>
          <br />
          <br />
          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Work_(physics)"}>Work</a>
          </div>
          <p>
            How much energy is required to exert a force across a distance. This
            is measured in joules.
          </p>
          <br />
          <br />
          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Power_(physics)"}>Power</a>
          </div>
          <p>
            How quickly an amount of work can be applied by the motor. Power is
            equal to work divided by time. The maximum power of a DC motor is
            generally found at half of the motor&apos;s maximum RPM.
          </p>
          <br />
          <br />
          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Power_(physics)"}>
              Resistance
            </a>
          </div>
          <p>
            Generally a metric not used in robot design, but is useful to know
            when calculating other properties of the motor. Generally, a lower
            internal resistance will result in a motor that draws less current
            for a given amount of power compared to one with a higher internal
            resistance.
          </p>
        </div>
      </section>
    </>
  );
}
