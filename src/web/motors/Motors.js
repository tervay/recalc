import Table from "common/components/Table";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import { measurementMax } from "common/tooling/math";
import { setTitle } from "common/tooling/routing";
import React from "react";

import motorsConfig from "./index";

export default function Motors() {
  setTitle(motorsConfig.title);

  const currents = [30, 40, 50];

  const data = React.useMemo(
    () =>
      Motor.getAllMotors().map((m) => {
        const powerToString = (p) => {
          return p.scalar <= 0 ? "-" : p.scalar.toFixed(0);
        };

        const power1 = m.getPower(new Measurement(currents[0], "A"));
        const power2 = m.getPower(new Measurement(currents[1], "A"));
        const power3 = m.getPower(new Measurement(currents[2], "A"));
        let numerator;

        // If, at any of 20/30/40A, the motor blows up, then
        if ([power1, power2, power3].some((element) => element.scalar <= 0)) {
          // For power:weight ratio, consider the max power it can achieve
          numerator = measurementMax(
            m.maxPower,
            m.getPower(new Measurement(currents[0], "A")),
            m.getPower(new Measurement(currents[1], "A")),
            m.getPower(new Measurement(currents[2], "A"))
          );
        } else {
          // Otherwise, consider the max power it can achieve at 40A
          numerator = m.getPower(new Measurement(currents[2], "A"));
        }

        return {
          link: <a href={m.url}>{m.name}</a>,
          freeSpeed: m.freeSpeed.scalar,
          freeCurrent: m.freeCurrent.scalar.toFixed(1),
          stallTorque: m.stallTorque.scalar.toFixed(2),
          stallCurrent: m.stallCurrent.scalar,
          kt: m.kT.scalar.toFixed(4),
          kv: m.kV.scalar.toFixed(1),
          powerAt10A: powerToString(power1),
          powerAt20A: powerToString(power2),
          powerAt40A: powerToString(power3),
          resistance: m.resistance.scalar.toFixed(3),
          weight: m.weight.scalar.toFixed(2),
          powerToWeight: numerator.div(m.weight).scalar.toFixed(2),
        };
      }),
    []
  );
  const columns = React.useMemo(
    () => [
      {
        Header: "Name",
        accessor: "link",
      },

      {
        Header: "Weight (lb)",
        accessor: "weight",
      },

      {
        Header: "Free Speed (RPM)",
        accessor: "freeSpeed",
      },
      {
        Header: "Stall Torque (Nm)",
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
        Header: `Peak power at ${currents[0]}A (W)`,
        accessor: "powerAt10A",
      },
      {
        Header: `Peak power at ${currents[1]}A (W)`,
        accessor: "powerAt20A",
      },
      {
        Header: `Peak power at ${currents[2]}A (W)`,
        accessor: "powerAt40A",
      },
      {
        Header: "Peak power : weight ratio (W/lb)",
        accessor: "powerToWeight",
      },
      {
        Header: "Resistance (Ω)",
        accessor: "resistance",
      },
      {
        Header: "kT (Nm/A)",
        accessor: "kt",
      },
      {
        Header: "kV (rpm/V)",
        accessor: "kv",
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
          <p className={"block"}>
            VEX has a great introduction to DC motors specs{" "}
            <a href={"https://motors.vex.com/introduction"}>here</a>.
          </p>
          <p className={"block"}>
            For calculating peak power at currents, I found the slope of the
            line representing the relationship between RPM and current. Using
            this, I found the RPM the motor would be spinning at if drawing the
            given current at 12 volts. Then, since{" "}
            <code>power = kT * current * rpm</code>, we can easily find the
            power generated. As for the power:weight ratio, I used either the
            max theoretical power of the motor, or the peak power at 50A,
            whichever was lower (since not all motors can survive 50A).
          </p>
          <p className={"block"}>
            All motors except for the Falcon 500 have 0.25 lbs added to their
            weight to represent the weight of a speed controller.
          </p>
          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Stall_torque"}>
              Stall torque
            </a>
          </div>
          <p className={"block"}>
            How much torque (rotational force) the motor outputs when the shaft
            is locked to zero RPM (which is known as stall).
          </p>
          <div className="title">Stall current</div>
          <p className={"block"}>
            How much current the motor draws when at stall. Note that there are
            further limitations on current draw implemented in the FRC control
            system, such as PDP breakers or software-implemented current limits.
          </p>
          <div className="title">Free Current</div>
          <p className={"block"}>
            How much current the motor draws when spinning freely at maximum RPM
            under no external load.
          </p>
          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Work_(physics)"}>Work</a>
          </div>
          <p className={"block"}>
            How much energy is required to exert a force across a distance. This
            is measured in joules.
          </p>
          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Power_(physics)"}>Power</a>
          </div>
          <p className={"block"}>
            How quickly an amount of work can be applied by the motor. Power is
            equal to work divided by time. The maximum power of a DC motor is
            generally found at half of the motor&apos;s maximum RPM.
          </p>{" "}
          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Motor_constants"}>
              Torque constant (kT) & Velocity constant (kV)
            </a>
          </div>
          <p className={"block"}>
            These are constants that are intrinsic to the physical construction
            of the motor. <code>kT</code> defines the relationship between
            current applied and torque output. It can be used to calculate the
            power output of a motor given a speed and current. This is useful to
            as as FRC robots are often current-limited. <code>kV</code> is the
            inverse of <code>kT</code>, and can also be defined as the RPM of
            the motor per volt applied.
          </p>
          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Power_(physics)"}>
              Resistance
            </a>
          </div>
          <p className={"block"}>
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
