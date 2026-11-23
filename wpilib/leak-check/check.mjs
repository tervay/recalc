import { pathToFileURL } from 'node:url';

const ITERATIONS = 50;

const { default: createModule } = await import(
  pathToFileURL(process.argv[2]).href
);
const m = await createModule();

const leaked = () => m.___lsan_do_recoverable_leak_check() !== 0;

const controls = Array.from({ length: 8 }, () => m._malloc(1024));
if (!leaked()) {
  console.error('LeakSanitizer did not detect the control leak');
  process.exit(1);
}
controls.forEach((p) => m._free(p));
console.log(
  'LeakSanitizer detected the control leak; the leak report above is expected',
);

const krakenX60 = () =>
  new m.DCMotor(12, 7.09, 366, 2, (6000 * Math.PI) / 30, 1);

const vector = (values) => {
  const v = new m.VectorDouble();
  for (const value of values) {
    v.push_back(value);
  }
  return v;
};

const workloads = {
  DCMotor: () => {
    const motor = krakenX60();
    motor.getFreeCurrentAmps();
    motor.getFreeSpeedRadPerSec();
    motor.getKtNMPerAmp();
    motor.getKvRadPerSecPerVolt();
    motor.getNominalVoltageVolts();
    motor.getROhms();
    motor.getStallCurrentAmps();
    motor.getStallTorqueNewtonMeters();
    motor.currentFromSpeedAndVoltage(300, 12);
    motor.currentFromTorque(2);
    motor.torqueFromCurrent(40);
    motor.voltageFromTorqueAndSpeed(2, 300);
    motor.speedFromTorqueAndVoltage(2, 12);
    motor.withReduction(5).delete();
    motor.delete();
  },
  DCMotorSim: () => {
    const motor = krakenX60();
    const sim = new m.DCMotorSim(motor, 0.001, 10);
    sim.setInputVoltage(12);
    for (let i = 0; i < 100; i++) {
      sim.update(0.001);
    }
    sim.getAngularPosition();
    sim.getAngularVelocity();
    sim.getAngularAcceleration();
    sim.getTorque();
    sim.getInputVoltage();
    sim.getJ();
    sim.getCurrentDraw();
    sim.delete();
    motor.delete();
  },
  BatterySim: () => {
    m.RoboRioSim_setVInVoltage(12.5);
    m.RobotController_getInputVoltage();
    const draws = vector([5, 10, 15]);
    m.BatterySim_calculateDefaultBatteryLoadedVoltage(draws);
    m.BatterySim_calculateLoadedBatteryVoltage(12, 0.02, draws);
    draws.delete();
  },
  simulateElevator: (motor) =>
    m.simulateElevator(motor, {
      gearing: 2,
      loadKg: 4.5359237,
      spoolRadiusMeters: 0.0254,
      travelDistanceMeters: 1.016,
      statorLimitAmps: 1000,
      supplyLimitAmps: 1000,
      batteryResistanceOhms: 0,
      batteryVoltageVolts: 12,
      simTimestep: 0.001,
      decimation: 1,
      maxSimSeconds: 3,
      angleRadians: Math.PI / 2,
      efficiency: 1,
      cascade: false,
      batteryVoltageFilterTimeConstantSeconds: 0.1,
      maxVelocityMPS: 2,
      maxAccelerationMPS2: 10,
      qPositionMeters: 0.1,
      qVelocityMPS: 0.1,
      rVolts: 12,
      sensorDelaySeconds: 0.001,
      kalmanFilterPositionStdDev: 0.0508,
      kalmanFilterVelocityStdDev: 1.016,
      kalmanFilterEncoderPositionStdDev: 2.54e-5,
    }),
  simulateFlywheel: (motor) =>
    m.simulateFlywheel(motor, {
      gearing: 1.5,
      momentOfInertiaKgMSquared: 0.003,
      targetAngularVelocityRadPerSec: 300,
      statorLimitAmps: 1000,
      supplyLimitAmps: 1000,
      statorVoltageVolts: 12,
      batteryResistanceOhms: 0,
      batteryVoltageVolts: 12,
      efficiency: 1,
      simTimestep: 0.0005,
      decimation: 1,
      maxSimSeconds: 3,
      batteryVoltageFilterTimeConstantSeconds: 0.1,
      initialAngularVelocityRadPerSec: 0,
    }),
  simulateArm: (motor) =>
    m.simulateArm(motor, {
      gearing: 100,
      momentOfInertiaKgMSquared: 0.0029263965,
      armLengthMeters: 0.6096,
      minAngleRadians: 0,
      maxAngleRadians: Math.PI / 2,
      startingAngleRadians: 0,
      statorLimitAmps: 60,
      supplyLimitAmps: 90,
      statorVoltageVolts: 12,
      batteryResistanceOhms: 0,
      batteryVoltageVolts: 12,
      efficiency: 1,
      goingUp: true,
      simTimestep: 0.001,
      decimation: 1,
      maxSimSeconds: 3,
      batteryVoltageFilterTimeConstantSeconds: 0.1,
    }),
  simulateMotorCurve: (motor) =>
    m.simulateMotorCurve(motor, {
      momentOfInertiaKgMSquared: 0.1 * (0.95 * 0.0254) ** 2,
      statorLimitAmps: 1000,
      supplyLimitAmps: 1000,
      statorVoltageVolts: 12,
      supplyVoltageVolts: 12,
      simTimestep: 1e-4,
      decimation: 1,
      maxIterations: 50000,
    }),
  computeElevatorFeedbackGains: (motor) =>
    m.computeElevatorFeedbackGains(motor, {
      gearing: 2,
      massKg: 4.5359237,
      spoolRadiusMeters: 0.0254,
      efficiency: 1,
      qPositionMeters: 0.1,
      qVelocityMPS: 0.1,
      rVolts: 12,
      dtSeconds: 0.02,
      sensorDelaySeconds: 0.001,
    }),
  computeArmFeedbackGains: (motor) =>
    m.computeArmFeedbackGains(motor, {
      gearing: 100,
      momentOfInertiaKgMSquared: 0.0029263965,
      efficiency: 1,
      qPositionRad: 0.1,
      qVelocityRadPerSec: 1,
      rVolts: 12,
      dtSeconds: 0.02,
      sensorDelaySeconds: 0.001,
    }),
  computeFlywheelFeedbackGains: (motor) =>
    m.computeFlywheelFeedbackGains(motor, {
      gearing: 1.5,
      momentOfInertiaKgMSquared: 0.003,
      efficiency: 1,
      qVelocityRadPerSec: 10,
      rVolts: 12,
      dtSeconds: 0.02,
      sensorDelaySeconds: 0.001,
    }),
  computeLinearFeedforwardGains: (motor) =>
    m.computeLinearFeedforwardGains(motor, {
      gearing: 2,
      loadKg: 4.5359237,
      spoolRadiusMeters: 0.0254,
      efficiency: 1,
      angleRadians: Math.PI / 2,
    }),
  computeAngularFeedforwardGains: (motor) =>
    m.computeAngularFeedforwardGains(motor, {
      gearing: 100,
      momentOfInertiaKgMSquared: 0.0029263965,
      efficiency: 1,
      comMassKg: 2,
      comLengthMeters: 0.3048,
    }),
  computeFlywheelFeedforwardGains: (motor) =>
    m.computeFlywheelFeedforwardGains(motor, {
      gearing: 1.5,
      momentOfInertiaKgMSquared: 0.003,
      efficiency: 1,
    }),
};

for (const [name, run] of Object.entries(workloads)) {
  const motor = krakenX60();
  for (let i = 0; i < ITERATIONS; i++) {
    run(motor);
  }
  motor.delete();
  console.log(`ran ${name} x${ITERATIONS}`);
}

if (leaked()) {
  console.error('LeakSanitizer found leaks in wpilibc_wasm');
  process.exit(1);
}
console.log('No leaks found in wpilibc_wasm');
