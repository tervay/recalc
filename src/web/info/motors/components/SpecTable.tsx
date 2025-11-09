import Tippy from "@tippyjs/react";
import Table from "common/components/styling/Table";
import { lb } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import Motor, { nominalVoltage } from "common/models/Motor";
import { MotorRules } from "common/models/Rules";
import { useMemo } from "react";
import { animateFill } from "tippy.js";
import { Replace } from "ts-toolbelt/out/Object/Replace";
import { Select } from "ts-toolbelt/out/Object/Select";

type MotorRow = {
  power20A: string;
  power40A: string;
  power60A: string;
  power80A: string;
  powerDensity20A: string;
  powerDensity40A: string;
  powerDensity60A: string;
  powerDensity80A: string;
  nameLink: JSX.Element;
  torqueDensity: string;
} & Replace<
  Select<Omit<Motor, "maxPower" | "b" | "controllerWeight">, Measurement>,
  Measurement,
  string
>;

function adjustedWeight(motor: Motor): Measurement {
  return motor.weight.add(motor.controllerWeight ?? lb(0));
}

function getPeakPowerAtCurrentLimit(motor: Motor, current: number): string {
  return (
    Array.from({ length: current }, (_, i) => current - i)
      .map(
        (i) =>
          new MotorRules(motor, new Measurement(i, "A"), {
            current: new Measurement(i, "A"),
            voltage: nominalVoltage,
          })
            .solve()
            .power.to("W").scalar,
      )
      .sort((a, b) => a - b)
      .pop()
      ?.toFixed(0) ?? "-"
  );
}

function getPowerWeightRatio(motor: Motor, current: number): string {
  return (
    Array.from({ length: current }, (_, i) => current - i)
      .map(
        (i) =>
          new MotorRules(motor, new Measurement(i, "A"), {
            current: new Measurement(i, "A"),
            voltage: nominalVoltage,
          })
            .solve()
            .power.to("W")
            .div(adjustedWeight(motor))
            .to("W/lb").scalar,
      )
      .filter((s) => s > 0)
      .sort((a, b) => a - b)
      .pop()
      ?.toFixed(0) ?? "-"
  );
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
    power20A: getPeakPowerAtCurrentLimit(motor, 20),
    power40A: getPeakPowerAtCurrentLimit(motor, 40),
    power60A: getPeakPowerAtCurrentLimit(motor, 60),
    power80A: getPeakPowerAtCurrentLimit(motor, 80),
    powerDensity20A: getPowerWeightRatio(motor, 20),
    powerDensity40A: getPowerWeightRatio(motor, 40),
    powerDensity60A: getPowerWeightRatio(motor, 60),
    powerDensity80A: getPowerWeightRatio(motor, 80),
    nameLink: (
      <a target={"_blank"} href={motor.url}>
        {motor.identifier}
      </a>
    ),
    diameter: motor.diameter.to("in").scalar.toFixed(2),
    kM: motor.kM.scalar.toFixed(3),
    torqueDensity: motor.stallTorque.div(motor.weight).scalar.toFixed(2),
  };
}

function getTableRows(): MotorRow[] {
  return Motor.getAllMotors().map((m) => getRowForMotor(m));
}

export default function SpecTable(): JSX.Element {
  const data = useMemo(() => getTableRows(), []);

  return (
    <>
      <div className="notification is-warning content">
        Modern brushless motor data is largely taken from CTRE{" "}
        <a href="https://motors.ctr-electronics.com">here</a>. NEO2 is not
        tested by CTRE yet, but theoretical specs are identical to NEO 1.1, so
        the data is set to the same. Old brushed motor data is taken from VEX{" "}
        <a href="https://motors.vex.com/">here</a>. Data missing from either
        site is taken from manufacturer datasheets.
        <ul>
          <li>
            The Falcon, Vortex, Kraken X60, and Kraken X44 motors have no weight
            added for motor controllers.
          </li>
          <li>
            The Minion motor has{" "}
            <a href="https://www.chiefdelphi.com/t/ctr-electronics-2024-25-new-products/473711/17?u=jtrv">
              0.32lb
            </a>{" "}
            added for the Talon FXS.
          </li>
          <li>
            All other motors have 0.25lb added for their motor controllers.
          </li>
        </ul>
      </div>
      <Table
        fullwidth
        hoverable
        textCentered
        columnSelector
        initialHiddenColumns={[
          "diameter",
          "resistance",
          "freeCurrent",
          "power20A",
          "power60A",
          "powerDensity20A",
          "powerDensity40A",
          "powerDensity60A",
        ]}
        columns={[
          {
            Header: "Name",
            accessor: "nameLink",
          },
          {
            Header: () => (
              <Tippy
                content={
                  "Non-Falcons have 0.25lbs added for speed controllers."
                }
                animateFill
                plugins={[animateFill]}
                allowHTML
              >
                <span className="underline-for-tooltip">{"Weight (lb)"}</span>
              </Tippy>
            ),
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
            Header: `Peak power (20A) (W)`,
            accessor: "power20A",
          },
          {
            Header: `Peak power (40A) (W)`,
            accessor: "power40A",
          },
          {
            Header: `Peak power (60A) (W)`,
            accessor: "power60A",
          },
          {
            Header: `Peak power (80A) (W)`,
            accessor: "power80A",
          },
          {
            Header: "Power Density (20A) (W/lb)",
            accessor: "powerDensity20A",
          },
          { Header: "Power Density (40A) (W/lb)", accessor: "powerDensity40A" },
          { Header: "Power Density (60A) (W/lb)", accessor: "powerDensity60A" },
          { Header: "Power Density (80A) (W/lb)", accessor: "powerDensity80A" },
          {
            Header: "Torque Density (Nm/lb)",
            accessor: "torqueDensity",
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
          {
            Header: "kM (Nm/sqrt(W))",
            accessor: "kM",
          },
        ]}
        data={data}
      />
    </>
  );
}
