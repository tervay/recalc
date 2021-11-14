import SimpleHeading from "common/components/heading/SimpleHeading";
import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import {
  BooleanInput,
  MeasurementInput,
  MotorInput,
  RatioInput,
} from "common/components/io/new/inputs";
import MeasurementOutput from "common/components/io/outputs/MeasurementOutput";
import { Column, Columns, Divider } from "common/components/styling/Building";
import Measurement from "common/models/Measurement";
import { useGettersSetters } from "common/tooling/conversion";
import { useEffect, useState } from "react";
import flywheelConfig, {
  FlywheelParamsV2,
  FlywheelStateV2,
} from "web/calculators/flywheel";
import { FlywheelState } from "web/calculators/flywheel/converter";
import {
  calculateFlywheelEnergy,
  calculateProjectileEnergy,
  calculateProjectileExitVelocity,
  calculateRecoveryTime,
  calculateShooterWheelSurfaceSpeed,
  calculateSpeedAfterShot,
  calculateWindupTime,
} from "web/calculators/flywheel/flywheelMath";

export default function FlywheelCalculator(): JSX.Element {
  const [get, set] = useGettersSetters(
    FlywheelState.getState() as FlywheelStateV2
  );

  const calculate = {
    windupTime: () =>
      calculateWindupTime(
        get.shooterMomentOfInertia.add(get.flywheelMomentOfInertia),
        get.motor,
        get.currentLimit,
        get.motorRatio,
        get.shooterTargetSpeed
      ),
    shooterMOI: () =>
      get.shooterRadius.mul(get.shooterRadius).mul(get.shooterWeight).div(2),
    flywheelMOI: () => {
      const pureMOI = get.flywheelRadius
        .mul(get.flywheelRadius)
        .mul(get.flywheelWeight)
        .div(2);

      return get.flywheelRatio.asNumber() === 0
        ? pureMOI.mul(0)
        : pureMOI
            .div(get.flywheelRatio.asNumber())
            .div(get.flywheelRatio.asNumber());
    },
    shooterTopSpeed: () =>
      get.motorRatio.asNumber() === 0
        ? new Measurement(0, "rpm")
        : get.motor.freeSpeed.div(get.motorRatio.asNumber()),
    shooterSurfaceSpeed: () =>
      calculateShooterWheelSurfaceSpeed(
        get.shooterTargetSpeed,
        get.shooterRadius
      ),
    projectileSpeed: () =>
      calculateProjectileExitVelocity(
        get.projectileWeight,
        get.shooterRadius,
        get.shooterMomentOfInertia.add(get.flywheelMomentOfInertia),
        shooterSurfaceSpeed
      ),
    projectileEnergy: () =>
      calculateProjectileEnergy(projectileSpeed, get.projectileWeight),
    flywheelEnergy: () =>
      calculateFlywheelEnergy(
        get.shooterMomentOfInertia.add(get.flywheelMomentOfInertia),
        get.shooterTargetSpeed
      ),
    speedAfterShot: () =>
      calculateSpeedAfterShot(
        get.shooterMomentOfInertia.add(get.flywheelMomentOfInertia),
        flywheelEnergy,
        projectileEnergy
      ),
    recoveryTime: () =>
      calculateRecoveryTime(
        get.shooterMomentOfInertia.add(get.flywheelMomentOfInertia),
        get.motor,
        get.motorRatio,
        1 / 100,
        get.shooterTargetSpeed,
        speedAfterShot,
        get.currentLimit
      ),
  };

  const [windupTime, setWindupTime] = useState(calculate.windupTime());
  const [shooterTopSpeed, setShooterTopSpeed] = useState(
    calculate.shooterTopSpeed()
  );
  const [shooterSurfaceSpeed, setShooterSurfaceSpeed] = useState(
    calculate.shooterSurfaceSpeed()
  );
  const [projectileSpeed, setProjectileSpeed] = useState(
    calculate.projectileSpeed()
  );
  const [projectileEnergy, setProjectileEnergy] = useState(
    calculate.projectileEnergy()
  );
  const [flywheelEnergy, setFlywheelEnergy] = useState(
    calculate.flywheelEnergy()
  );
  const [speedAfterShot, setSpeedAfterShot] = useState(
    calculate.speedAfterShot()
  );
  const [recoveryTime, setRecoveryTime] = useState(calculate.recoveryTime());

  useEffect(() => {
    if (!get.useCustomShooterMoi) {
      set.setShooterMomentOfInertia(calculate.shooterMOI());
    }
  }, [get.shooterRadius, get.shooterWeight, get.useCustomShooterMoi]);

  useEffect(() => {
    setFlywheelEnergy(calculate.flywheelEnergy());
  }, [
    get.shooterMomentOfInertia,
    get.flywheelMomentOfInertia,
    get.shooterTargetSpeed,
  ]);

  useEffect(() => {
    if (!get.useCustomFlywheelMoi) {
      set.setFlywheelMomentOfInertia(calculate.flywheelMOI());
    }
  }, [
    get.flywheelRadius,
    get.flywheelWeight,
    get.useCustomFlywheelMoi,
    get.flywheelRatio,
  ]);

  useEffect(() => {
    setWindupTime(calculate.windupTime());
  }, [
    get.motor,
    get.currentLimit,
    get.motorRatio,
    get.shooterTargetSpeed,
    get.shooterMomentOfInertia,
    get.flywheelMomentOfInertia,
  ]);

  useEffect(() => {
    setShooterSurfaceSpeed(calculate.shooterSurfaceSpeed());
  }, [get.shooterTargetSpeed, get.shooterRadius]);

  useEffect(() => {
    setProjectileSpeed(calculate.projectileSpeed());
  }, [
    get.projectileWeight,
    get.shooterRadius,
    get.shooterMomentOfInertia,
    get.flywheelMomentOfInertia,
    shooterSurfaceSpeed,
  ]);

  useEffect(() => {
    setProjectileEnergy(calculate.projectileEnergy());
  }, [projectileSpeed, get.projectileWeight]);

  useEffect(() => {
    setSpeedAfterShot(calculate.speedAfterShot());
  }, [
    get.shooterMomentOfInertia,
    get.flywheelMomentOfInertia,
    flywheelEnergy,
    projectileEnergy,
  ]);

  useEffect(() => {
    setRecoveryTime(calculate.recoveryTime());
  }, [
    get.shooterMomentOfInertia,
    get.flywheelMomentOfInertia,
    get.motor,
    get.motorRatio,
    get.shooterTargetSpeed,
    speedAfterShot,
    get.currentLimit,
  ]);

  useEffect(() => {
    setShooterTopSpeed(calculate.shooterTopSpeed());
  }, [get.motor, get.motorRatio]);

  return (
    <>
      <SimpleHeading
        state={get}
        title={flywheelConfig.title}
        queryParams={FlywheelParamsV2}
      />
      <Columns multiline>
        <Column>
          <SingleInputLine
            label="Motor"
            id="motor"
            tooltip="The motors powering the system."
          >
            <MotorInput stateHook={[get.motor, set.setMotor]} />
          </SingleInputLine>
          <SingleInputLine
            label="Current Limit"
            id="currentLimit"
            tooltip="The current limit applied to each motor."
          >
            <MeasurementInput
              stateHook={[get.currentLimit, set.setCurrentLimit]}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Shooter Ratio"
            id="shooterRatio"
            tooltip="The ratio between the motors and the shooter wheel(s)."
          >
            <RatioInput stateHook={[get.motorRatio, set.setMotorRatio]} />
          </SingleInputLine>
          <SingleInputLine
            label="Shooter Max Speed"
            id="shooterMaxSpeed"
            tooltip="The max possible speed of the shooter wheel(s)."
          >
            <MeasurementOutput
              stateHook={[shooterTopSpeed, setShooterTopSpeed]}
              numberRoundTo={0}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Target Shooter RPM"
            id="shooterRPM"
            tooltip="The desired speed of the shooter wheel(s)."
          >
            <MeasurementInput
              stateHook={[get.shooterTargetSpeed, set.setShooterTargetSpeed]}
              dangerIf={() => get.shooterTargetSpeed.gte(shooterTopSpeed)}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Projectile Weight"
            id="projectileWeight"
            tooltip="The weight of the ball you are shooting."
          >
            <MeasurementInput
              stateHook={[get.projectileWeight, set.setProjectileWeight]}
            />
          </SingleInputLine>

          <Divider color={"primary"}>Shooter Wheel Properties</Divider>
          <SingleInputLine
            label="Shooter Radius"
            id="shooterRadius"
            tooltip="The radius of the shooter wheel(s)."
          >
            <MeasurementInput
              stateHook={[get.shooterRadius, set.setShooterRadius]}
              numberDisabledIf={() => get.useCustomShooterMoi}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Shooter Weight"
            id="shooterWeight"
            tooltip="The weight of the shooter wheel(s)."
          >
            <MeasurementInput
              stateHook={[get.shooterWeight, set.setShooterWeight]}
              numberDisabledIf={() => get.useCustomShooterMoi}
            />
          </SingleInputLine>
          <Columns formColumns>
            <Column ofTwelve={5}>
              <SingleInputLine
                label="Use Custom Shooter MOI"
                id="useCustomShooterMOI"
                tooltip="Use if you already have a moment of inertia for your shooter wheel(s), likely from CAD."
              >
                <BooleanInput
                  stateHook={[
                    get.useCustomShooterMoi,
                    set.setUseCustomShooterMoi,
                  ]}
                />
              </SingleInputLine>
            </Column>
            <Column>
              <SingleInputLine
                label="Custom Shooter MOI"
                id="customShooterMOI"
                tooltip="The moment of inertia of the shooter wheel(s)."
              >
                <MeasurementInput
                  stateHook={[
                    get.shooterMomentOfInertia,
                    set.setShooterMomentOfInertia,
                  ]}
                  numberDisabledIf={() => !get.useCustomShooterMoi}
                  numberRoundTo={1}
                />
              </SingleInputLine>
            </Column>
          </Columns>
          <Divider color="primary">Flywheel Properties</Divider>
          <SingleInputLine
            label="Flywheel Radius"
            id="flywheelRadius"
            tooltip="The radius of the weighted flywheel."
          >
            <MeasurementInput
              stateHook={[get.flywheelRadius, set.setFlywheelRadius]}
              numberDisabledIf={() => get.useCustomFlywheelMoi}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Flywheel Weight"
            id="flywheelWeight"
            tooltip="The weight of the weighted flywheel. Use zero if you don't have one."
          >
            <MeasurementInput
              stateHook={[get.flywheelWeight, set.setFlywheelWeight]}
              numberDisabledIf={() => get.useCustomFlywheelMoi}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Flywheel:Shooter Ratio"
            id="flywheelShooterRatio"
            tooltip="The ratio between the flywheel and the shooter wheel(s). Use 1 if coaxial."
          >
            <RatioInput stateHook={[get.flywheelRatio, set.setFlywheelRatio]} />
          </SingleInputLine>
          <Columns formColumns>
            <Column ofTwelve={5}>
              <SingleInputLine
                label="Use Custom Flywheel MOI"
                id="useCustomFlywheelMOI"
                tooltip="Use if you already have a moment of inertia for your flywheel, likely from CAD or a vendor."
              >
                <BooleanInput
                  stateHook={[
                    get.useCustomFlywheelMoi,
                    set.setUseCustomFlywheelMoi,
                  ]}
                />
              </SingleInputLine>
            </Column>
            <Column>
              <SingleInputLine
                label="Custom Flywheel MOI"
                id="customFlywheelMOI"
                tooltip="The moment of inertia of the flywheel."
              >
                <MeasurementInput
                  stateHook={[
                    get.flywheelMomentOfInertia,
                    set.setFlywheelMomentOfInertia,
                  ]}
                  numberDisabledIf={() => !get.useCustomFlywheelMoi}
                  numberRoundTo={1}
                />
              </SingleInputLine>
            </Column>
          </Columns>
        </Column>
        <Column>
          <Divider color="primary">Outputs</Divider>
          <SingleInputLine
            label="Estimated Windup Time"
            id="windupTime"
            tooltip="The estimated time it takes the system to reach the target speed from rest."
          >
            <MeasurementOutput
              stateHook={[windupTime, setWindupTime]}
              numberRoundTo={2}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Estimated Recovery Time"
            id="recoveryTime"
            tooltip="The estimated time it takes the system to reach the target speed immediately following a shot."
          >
            <MeasurementOutput
              stateHook={[recoveryTime, setRecoveryTime]}
              numberRoundTo={4}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Shooter Wheel Surface Speed"
            id="surfaceSpeed"
            tooltip="The speed of the surface of the shooter wheel(s)."
          >
            <MeasurementOutput
              stateHook={[shooterSurfaceSpeed, setShooterSurfaceSpeed]}
              numberRoundTo={2}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Estimated Projectile Speed"
            id="projectileSpeed"
            tooltip="The estimated speed of the projectile after being shot."
          >
            <MeasurementOutput
              stateHook={[projectileSpeed, setProjectileSpeed]}
              numberRoundTo={2}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Estimated Speed After Shot"
            id="speedAfterShot"
            tooltip="The estimated speed of the shooter wheels immediately following a shot."
          >
            <MeasurementOutput
              stateHook={[speedAfterShot, setSpeedAfterShot]}
              numberRoundTo={0}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Flywheel Energy"
            id="flywheelEnergy"
            tooltip="The energy stored in the flywheel."
          >
            <MeasurementOutput
              stateHook={[flywheelEnergy, setFlywheelEnergy]}
              numberRoundTo={0}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Projectile Energy"
            id="projectileEnergy"
            tooltip="The amount of energy transferred into the projectile in a shot."
          >
            <MeasurementOutput
              stateHook={[projectileEnergy, setProjectileEnergy]}
              numberRoundTo={0}
            />
          </SingleInputLine>
        </Column>
      </Columns>
    </>
  );
}
