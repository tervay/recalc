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
        name: m.name,
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
        accessor: "name",
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
        Header: "Resistance (ohm)",
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
    </>
  );
}
