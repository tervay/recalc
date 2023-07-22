import { screen } from "@testing-library/react";
import testWrapper from "testing/testWrapper";
import FlywheelCalculator from "web/calculators/flywheel/components/FlywheelCalculator";

const inputs = {
  motor: () => screen.getByTestId("motor"),
  shooterRPM: () => screen.getByTestId("shooterRPM"),
  currentLimit: () => screen.getByTestId("currentLimit"),
  shooterRatio: () => screen.getByTestId("shooterRatio"),
  projectileWeight: () => screen.getByTestId("projectileWeight"),
  shooterRadius: () => screen.getByTestId("shooterRadius"),
  shooterWeight: () => screen.getByTestId("shooterWeight"),
  flywheelRadius: () => screen.getByTestId("flywheelRadius"),
  flywheelWeight: () => screen.getByTestId("flywheelWeight"),
  flywheelShooterRatio: () => screen.getByTestId("flywheelShooterRatio"),
};

const inputSelects = {
  motor: () => screen.getByTestId("selectmotor"),
  shooterRatio: () => screen.getByTestId("selectshooterRatio"),
  shooterMaxSpeed: () => screen.getByTestId("selectshooterMaxSpeed"),
  projectileWeight: () => screen.getByTestId("selectprojectileWeight"),
  shooterRadius: () => screen.getByTestId("selectshooterRadius"),
  shooterWeight: () => screen.getByTestId("selectshooterWeight"),
  flywheelRadius: () => screen.getByTestId("selectflywheelRadius"),
  flywheelWeight: () => screen.getByTestId("selectflywheelWeight"),
  flywheelShooterRatio: () => screen.getByTestId("selectflywheelShooterRatio"),
};

const outputs = {
  shooterMaxSpeed: () => screen.getByTestId("shooterMaxSpeed"),
  customShooterMOI: () => screen.getByTestId("customShooterMOI"),
  customFlywheelMOI: () => screen.getByTestId("customFlywheelMOI"),
  windupTime: () => screen.getByTestId("windupTime"),
  recoveryTime: () => screen.getByTestId("recoveryTime"),
  surfaceSpeed: () => screen.getByTestId("surfaceSpeed"),
  projectileSpeed: () => screen.getByTestId("projectileSpeed"),
  speedAfterShot: () => screen.getByTestId("speedAfterShot"),
  flywheelEnergy: () => screen.getByTestId("flywheelEnergy"),
  projectileEnergy: () => screen.getByTestId("projectileEnergy"),
};

const secondaryInputs = {};

testWrapper<
  typeof inputs,
  typeof outputs,
  typeof inputSelects,
  typeof secondaryInputs
>(
  <FlywheelCalculator />,
  {
    name: "FlywheelCalculator",
  },
  inputs,
  outputs,
  inputSelects,
  [
    [
      {
        change: { key: "motor", value: "3" },
      },
      {
        shooterRPM: 11000,
        currentLimit: 40,
        shooterRatio: 2,
        projectileWeight: 5,
        shooterRadius: 3,
        shooterWeight: 1,
        flywheelRadius: 2,
        flywheelWeight: 1.5,
        flywheelShooterRatio: 1,
        shooterMaxSpeed: 12760,
        customShooterMOI: 4.5,
        customFlywheelMOI: 3.0,
        windupTime: 2.76,
        recoveryTime: 0.4469,
        surfaceSpeed: 287.98,
        projectileSpeed: 27.69,
        speedAfterShot: 10564,
        flywheelEnergy: 1456,
        projectileEnergy: 113,
      },
    ],
    [
      {
        change: { key: "shooterRPM", value: "1321" },
      },
      {
        motor: 2,
        currentLimit: 40,
        shooterRatio: 2,
        projectileWeight: 5,
        shooterRadius: 3,
        shooterWeight: 1,
        flywheelRadius: 2,
        flywheelWeight: 1.5,
        flywheelShooterRatio: 1,
        shooterMaxSpeed: 12760,
        customShooterMOI: 4.5,
        customFlywheelMOI: 3.0,
        windupTime: 0.23,
        recoveryTime: 0.0142,
        surfaceSpeed: 34.58,
        projectileSpeed: 3.33,
        speedAfterShot: 1269,
        flywheelEnergy: 21,
        projectileEnergy: 2,
      },
    ],
    [
      {
        change: { key: "currentLimit", value: "32" },
      },
      {
        motor: 2,
        shooterRPM: 11000,
        shooterRatio: 2,
        projectileWeight: 5,
        shooterRadius: 3,
        shooterWeight: 1,
        flywheelRadius: 2,
        flywheelWeight: 1.5,
        flywheelShooterRatio: 1,
        shooterMaxSpeed: 12760,
        customShooterMOI: 4.5,
        customFlywheelMOI: 3.0,
        windupTime: 5.22,
        recoveryTime: 0.8462,
        surfaceSpeed: 287.98,
        projectileSpeed: 27.69,
        speedAfterShot: 10564,
        flywheelEnergy: 1456,
        projectileEnergy: 113,
      },
    ],
    [
      {
        change: { key: "shooterRatio", value: "3" },
      },
      {
        motor: 2,
        shooterRPM: 11000,
        currentLimit: 40,
        projectileWeight: 5,
        shooterRadius: 3,
        shooterWeight: 1,
        flywheelRadius: 2,
        flywheelWeight: 1.5,
        flywheelShooterRatio: 1,
        shooterMaxSpeed: 19140,
        customShooterMOI: 4.5,
        customFlywheelMOI: 3.0,
        windupTime: 2.68,
        recoveryTime: 0.3637,
        surfaceSpeed: 287.98,
        projectileSpeed: 27.69,
        speedAfterShot: 10564,
        flywheelEnergy: 1456,
        projectileEnergy: 113,
      },
    ],
    [
      {
        change: { key: "projectileWeight", value: "7" },
      },
      {
        motor: 2,
        shooterRPM: 11000,
        currentLimit: 40,
        shooterRatio: 2,
        shooterRadius: 3,
        shooterWeight: 1,
        flywheelRadius: 2,
        flywheelWeight: 1.5,
        flywheelShooterRatio: 1,
        shooterMaxSpeed: 12760,
        customShooterMOI: 4.5,
        customFlywheelMOI: 3.0,
        windupTime: 4.13,
        recoveryTime: 0.4983,
        surfaceSpeed: 287.98,
        projectileSpeed: 20.93,
        speedAfterShot: 10653,
        flywheelEnergy: 1456,
        projectileEnergy: 90,
      },
    ],
    [
      {
        change: { key: "shooterRadius", value: "2" },
      },
      {
        motor: 2,
        shooterRPM: 11000,
        currentLimit: 40,
        shooterRatio: 2,
        projectileWeight: 5,
        shooterWeight: 1,
        flywheelRadius: 2,
        flywheelWeight: 1.5,
        flywheelShooterRatio: 1,
        shooterMaxSpeed: 12760,
        customShooterMOI: 2.0,
        customFlywheelMOI: 3.0,
        windupTime: 2.76,
        recoveryTime: 0.5842,
        surfaceSpeed: 191.99,
        projectileSpeed: 25.26,
        speedAfterShot: 10453,
        flywheelEnergy: 971,
        projectileEnergy: 94,
      },
    ],
    [
      {
        change: { key: "shooterWeight", value: "3" },
      },
      {
        motor: 2,
        shooterRPM: 11000,
        currentLimit: 40,
        shooterRatio: 2,
        projectileWeight: 5,
        shooterRadius: 3,
        flywheelRadius: 2,
        flywheelWeight: 1.5,
        flywheelShooterRatio: 1,
        shooterMaxSpeed: 12760,
        customShooterMOI: 13.5,
        customFlywheelMOI: 3.0,
        windupTime: 9.1,
        recoveryTime: 2.2874,
        surfaceSpeed: 287.98,
        projectileSpeed: 49.5,
        speedAfterShot: 10361,
        flywheelEnergy: 3204,
        projectileEnergy: 361,
      },
    ],
    [
      {
        change: { key: "flywheelRadius", value: "3" },
      },
      {
        motor: 2,
        shooterRPM: 11000,
        currentLimit: 40,
        shooterRatio: 2,
        projectileWeight: 5,
        shooterRadius: 3,
        shooterWeight: 1,
        flywheelWeight: 1.5,
        flywheelShooterRatio: 1,
        shooterMaxSpeed: 12760,
        customShooterMOI: 4.5,
        customFlywheelMOI: 6.7,
        windupTime: 6.2,
        recoveryTime: 1.3145,
        surfaceSpeed: 287.98,
        projectileSpeed: 37.89,
        speedAfterShot: 10453,
        flywheelEnergy: 2184,
        projectileEnergy: 212,
      },
    ],
    [
      {
        change: { key: "flywheelWeight", value: "2" },
      },
      {
        motor: 2,
        shooterRPM: 11000,
        currentLimit: 40,
        shooterRatio: 2,
        projectileWeight: 5,
        shooterRadius: 3,
        shooterWeight: 1,
        flywheelRadius: 2,
        flywheelShooterRatio: 1,
        shooterMaxSpeed: 12760,
        customShooterMOI: 4.5,
        customFlywheelMOI: 4.0,
        windupTime: 4.69,
        recoveryTime: 0.8334,
        surfaceSpeed: 287.98,
        projectileSpeed: 30.6,
        speedAfterShot: 10530,
        flywheelEnergy: 1650,
        projectileEnergy: 138,
      },
    ],
    [
      {
        change: { key: "flywheelShooterRatio", value: "2" },
      },
      {
        motor: 2,
        shooterRPM: 11000,
        currentLimit: 40,
        shooterRatio: 2,
        projectileWeight: 5,
        shooterRadius: 3,
        shooterWeight: 1,
        flywheelRadius: 2,
        flywheelWeight: 1.5,
        shooterMaxSpeed: 12760,
        customShooterMOI: 4.5,
        customFlywheelMOI: 3,
        windupTime: 2.89,
        recoveryTime: 0.3418,
        surfaceSpeed: 287.98,
        projectileSpeed: 20.57,
        speedAfterShot: 10658,
        flywheelEnergy: 1019,
        projectileEnergy: 62,
      },
    ],
  ],
);
