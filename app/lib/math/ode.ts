import Measurement, { type MeasurementDict } from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';

export type ODEFunction = (
  t: number,
  y: number[],
) => {
  changeRates: number[];
  shouldStop: boolean;
};

export default class ODESolver {
  constructor(
    private readonly ode: ODEFunction,
    private readonly y0: number[],
    private readonly t0: number,
    private readonly t1: number,
  ) {}

  euler(resolution: number) {
    const h = (this.t1 - this.t0) / resolution;
    const ts = Array.from(Array(resolution + 1), (_, k) => k * h + this.t0); //time series datapoints
    const ys: number[][] = Array.from(
      Array(resolution + 1),
      () => Array(this.y0.length).fill(0) as number[],
    );
    ys[0] = this.y0;

    for (let i = 0; i < resolution; i++) {
      ys[i + 1] = this.ode(ts[i], ys[i]).changeRates.map(
        (x, j) => ys[i][j] + x * h,
      ); //y_n+1 = y_n + dy/dx *h
    }

    return {
      ts: ts,
      ys: ys,
    };
  }

  rk4(resolution: number) {
    const h = (this.t1 - this.t0) / resolution;
    const ts = Array.from(Array(resolution + 1), (_, k) => k * h + this.t0); //time series datapoints
    const ys = Array.from(
      Array(resolution + 1),
      () => Array(this.y0.length).fill(0) as number[],
    );
    ys[0] = this.y0;

    if (this.y0.includes(NaN))
      console.warn('y0 contains invalid starting value', this.y0);

    let stoppingIndex = 0;
    for (let i = 0; i < resolution; i++) {
      stoppingIndex = i;
      let k = this.ode(ts[i], ys[i]); // f(t, y_n)
      const k1 = k.changeRates;

      if (k.shouldStop) {
        break;
      }

      const s1 = ys[i].map((y, j) => y + (k1[j] * h) / 2);
      k = this.ode(ts[i] + h / 2, s1); // f(t + h/2, y_n + k1*h/2)
      const k2 = k.changeRates;

      if (k.shouldStop) {
        break;
      }

      const s2 = ys[i].map((y, j) => y + (k2[j] * h) / 2);
      k = this.ode(ts[i] + h / 2, s2); // f(t + h/2, y_n + k2*h/2)
      const k3 = k.changeRates;

      if (k.shouldStop) {
        break;
      }

      const s3 = ys[i].map((y, j) => y + k3[j] * h);
      k = this.ode(ts[i] + h, s3); // f(t + h, y_n + k3*h)
      const k4 = k.changeRates;

      if (k.shouldStop) {
        break;
      }

      ys[i + 1] = ys[i].map(
        (x, j) => x + (k1[j] / 6 + k2[j] / 3 + k3[j] / 3 + k4[j] / 6) * h,
      ); //y_n+1 = y_n + (k1 +2*k2 + 2*k3 +k4)/6 *h
    }

    return {
      ts: ts.slice(0, stoppingIndex),
      ys: ys.slice(0, stoppingIndex),
    };
  }

  midpoint(resolution: number) {
    const h = (this.t1 - this.t0) / resolution;
    const ts = Array.from(Array(resolution + 1), (_, k) => k * h + this.t0); //time series datapoints
    const ys = Array.from(
      Array(resolution + 1),
      () => Array(this.y0.length).fill(0) as number[],
    );
    ys[0] = this.y0;

    for (let i = 0; i < resolution; i++) {
      const k1 = this.ode(ts[i], ys[i]).changeRates; // f(t, y_n)

      const s1 = ys[i].map((y, j) => y + (k1[j] * h) / 2); // y_n + k1 * h/2
      const k2 = this.ode(ts[i] + h / 2, s1).changeRates; // f(t + h/2, y_n + k1*h/2)
      ys[i + 1] = ys[i].map((x, j) => x + k2[j] * h); //y_n+1 = y_n + k2 *h
    }
    return {
      ts: ts,
      ys: ys,
    };
  }
}

export type StoppingInfo = {
  position: Measurement;
  velocity: Measurement;
  currentDraw: Measurement;
  stepNumber: number;
};

export interface ODEResult {
  positionRad: Measurement;
  velocityRPM: Measurement;
  statorDrawAmps: Measurement;
  time: Measurement;
  power: Measurement;
  losses: Measurement;
  efficiency: number;
  torque: Measurement;
}

export interface ODEResultDicts {
  positionRad: MeasurementDict;
  velocityRPM: MeasurementDict;
  statorDrawAmps: MeasurementDict;
  time: MeasurementDict;
  power: MeasurementDict;
  losses: MeasurementDict;
  efficiency: number;
  torque: MeasurementDict;
}

export function solveMotorODE(
  motor: Motor,
  statorVoltage: Measurement,
  supplyVoltage: Measurement,
  supplyLimit: Measurement,
  statorLimit: Measurement,
  shouldStop: (info: StoppingInfo) => boolean,
  J: Measurement,
  antiTorque: Measurement,
  efficiency: number,
): ODEResult[] {
  const B = motor.b;

  const microHenryToHenry = (n: number) => n / 1e6;
  const milliHenryToHenry = (n: number) => n / 1e3;
  let L = new Measurement(microHenryToHenry(35), 'H');
  if (motor.identifier === '775pro' || motor.identifier === '775 RedLine') {
    L = new Measurement(microHenryToHenry(47), 'H');
  } else if (motor.identifier === 'miniCIM') {
    L = new Measurement(microHenryToHenry(145), 'H');
  } else if (motor.identifier === 'Core Hex') {
    L = new Measurement(milliHenryToHenry(52), 'H');
  } else if (motor.identifier === 'CIM') {
    L = new Measurement(microHenryToHenry(132), 'H');
  } else if (motor.identifier === 'BAG') {
    L = new Measurement(microHenryToHenry(138), 'H');
  } else if (motor.identifier === 'NEO') {
    L = new Measurement(microHenryToHenry(35), 'H');
  } else if (motor.identifier === 'NEO 550') {
    L = new Measurement(microHenryToHenry(10), 'H');
  }

  // https://github.com/frc971/971-Robot-Code/blob/ecfddf97eb3783916f4355dec98400e0811d3571/frc971/control_loops/python/control_loop.py#L745C30-L745C58
  const inherentMotorInertia = new Measurement(0.00005822569, 'kg m2');

  const duration = 30;
  const numStepsPerSec = 1000;
  const steps = duration * numStepsPerSec;
  const supplyLimitInStatorAmps = supplyLimit.mul(
    supplyVoltage.div(statorVoltage),
  );

  const voltageRatio = statorVoltage.div(supplyVoltage);

  const stallCurrent = motor.stallCurrent.mul(voltageRatio);
  const freeCurrent = motor.freeCurrent.mul(voltageRatio);
  const _freeSpeed = motor.freeSpeed.mul(voltageRatio);
  const _stallTorque = motor.stallTorque.mul(voltageRatio);

  const solver = new ODESolver(
    (t, y) => {
      const prevVel = new Measurement(y[0], 'rad/s');
      const prevCurrent = new Measurement(y[1], 'A');
      const prevCurrLimit = new Measurement(y[2], 'A');
      const prevPosition = new Measurement(y[3], 'rad');

      const currToUse = prevCurrent.gte(prevCurrLimit)
        ? prevCurrLimit
        : prevCurrent;

      const limited =
        prevCurrent.gte(supplyLimitInStatorAmps) ||
        prevCurrent.gte(prevCurrLimit);

      const newCurrentPerSec = statorVoltage
        .sub(motor.resistance.mul(prevCurrent))
        .sub(motor.kV.inverse().mul(prevVel))
        .div(L);

      const newVelocityPerSec = Measurement.max(
        new Measurement(0, 'N m'),
        motor.kT
          .mul(efficiency / 100)
          .mul(currToUse)
          .sub(antiTorque)
          .sub(B.mul(prevVel)),
      )
        .div(J.add(inherentMotorInertia))
        .mul(new Measurement(1, 'rad'))
        .mul(motor.quantity)
        .toBase();

      return {
        changeRates: [
          newVelocityPerSec.scalar === 0
            ? 0
            : newVelocityPerSec.to('rad/s2').scalar,
          newCurrentPerSec.to('A/s').scalar,
          limited ? 0 : newCurrentPerSec.to('A/s').scalar,
          prevVel.to('rad/s').scalar,
        ],
        shouldStop: shouldStop({
          currentDraw: currToUse,
          position: prevPosition,
          stepNumber: t * numStepsPerSec,
          velocity: prevVel,
        }),
      };
    },
    [
      0,
      stallCurrent.scalar,
      Measurement.min(statorLimit, supplyLimitInStatorAmps).to('A').scalar,
      0,
    ],
    0,
    duration,
  );

  const rk4Result = solver.rk4(steps);
  const results: ODEResult[] = [];

  rk4Result.ys.forEach((y, i) => {
    const shouldApplyLimit = y[1] >= y[2];
    const currentDraw = shouldApplyLimit ? y[2] : y[1];

    const power = motor.kT
      .mul(new Measurement(currentDraw, 'A').sub(freeCurrent))
      .mul(new Measurement(y[0], 'rad/s'))
      .removeRad()
      .to('W');

    const losses = new Measurement(currentDraw, 'A')
      .mul(new Measurement(currentDraw, 'A'))
      .mul(motor.resistance)
      .add(statorVoltage.mul(freeCurrent));

    results.push({
      time: new Measurement(rk4Result.ts[i], 's'),
      positionRad: new Measurement(y[3], 'rad'),
      velocityRPM: new Measurement(y[0], 'rad/s'),
      statorDrawAmps: new Measurement(currentDraw, 'A'),
      power: power,
      losses: losses,
      efficiency: power.div(power.add(losses)).baseScalar,
      torque: motor.kT.mul(new Measurement(y[2], 'A')).to('N m'),
    });
  });

  return results;
}
