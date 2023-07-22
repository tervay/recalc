import Table from "common/components/styling/Table";
import { A, lb } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import Motor, { nominalVoltage } from "common/models/Motor";
import { MotorRules } from "common/models/Rules";
import { useMemo } from "react";
import { Replace } from "ts-toolbelt/out/Object/Replace";
import { Select } from "ts-toolbelt/out/Object/Select";

type MotorRow = {
  power30A: string;
  power40A: string;
  power50A: string;
  powerWeightRatio: string;
  nameLink: JSX.Element;
} & Replace<Select<Omit<Motor, "maxPower">, Measurement>, Measurement, string>;

function adjustedWeight(motor: Motor): Measurement {
  return motor.weight.add(motor.identifier === "Falcon 500" ? lb(0) : lb(0.25));
}

function getPeakPowerAtCurrentLimit(
  motor: Motor,
  currentLimit: Measurement,
): string {
  const power = new MotorRules(motor, currentLimit, {
    current: currentLimit,
    voltage: nominalVoltage,
  })
    .solve()
    .power.to("W");

  return power.scalar <= 0 ? "-" : power.scalar.toFixed(0);
}

function getPowerWeightRatio(motor: Motor): string {
  for (let i = 50; i > 0; i--) {
    const power = new MotorRules(motor, new Measurement(i, "A"), {
      current: new Measurement(i, "A"),
      voltage: nominalVoltage,
    }).solve().power;
    if (power.to("W").scalar > 0) {
      return power.div(adjustedWeight(motor)).to("W/lb").scalar.toFixed(1);
    }
  }

  return "-";
}

function getRowForMotor(motor: Motor): MotorRow {
  return {
    freeCurrent: motor.freeCurrent.to("A").scalar.toFixed(1),
    freeSpeed: motor.freeSpeed.to("rpm").scalar.toFixed(0),
    kT: motor.kT.to("N*m/A").scalar.toFixed(4),
    kV: motor.kV.to("rpm/V").scalar.toFixed(1),
    resistance: motor.resistance.to("ohm").scalar.toFixed(3),
    stallCurrent: motor.stallCurrent.to("A").scalar.toFixed(0),
    stallTorque: motor.stallTorque.to("N*m").scalar.toFixed(2),
    weight: adjustedWeight(motor).to("lbs").scalar.toFixed(2),
    power30A: getPeakPowerAtCurrentLimit(motor, A(30)),
    power40A: getPeakPowerAtCurrentLimit(motor, A(40)),
    power50A: getPeakPowerAtCurrentLimit(motor, A(50)),
    powerWeightRatio: getPowerWeightRatio(motor),
    nameLink: (
      <a target={"_blank"} href={motor.url}>
        {motor.identifier}
      </a>
    ),
    diameter: motor.diameter.to("in").scalar.toFixed(2),
  };
}

function getTableRows(): MotorRow[] {
  return Motor.getAllMotors().map((m) => getRowForMotor(m));
}

export default function SpecTable(): JSX.Element {
  const data = useMemo(() => getTableRows(), []);

  return (
    <Table
      fullwidth
      hoverable
      textCentered
      columns={[
        {
          Header: "Name",
          accessor: "nameLink",
        },
        {
          Header: "Weight (lb)",
          accessor: "weight",
        },
        {
          Header: "Diameter (in)",
          accessor: "diameter",
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
          Header: `Peak power at 30A (W)`,
          accessor: "power30A",
        },
        {
          Header: `Peak power at 40A (W)`,
          accessor: "power40A",
        },
        {
          Header: `Peak power at 50A (W)`,
          accessor: "power50A",
        },
        {
          Header: "Peak power : weight ratio (W/lb)",
          accessor: "powerWeightRatio",
        },
        {
          Header: "Resistance (Ω)",
          accessor: "resistance",
        },
        {
          Header: "kT (Nm/A)",
          accessor: "kT",
        },
        {
          Header: "kV (rpm/V)",
          accessor: "kV",
        },
      ]}
      data={data}
    />
  );
}
