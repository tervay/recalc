import Measurement from '~/lib/models/Measurement';
import Model from '~/lib/models/Model';

export const nominalVoltage = new Measurement(12, 'V');
export const highCurrentLimit = new Measurement(1000, 'A');

interface MotorSpecs {
  voltage: Measurement;
  stallTorque: Measurement;
  stallCurrent: Measurement;
  freeCurrent: Measurement;
  freeSpeed: Measurement;
  name: string;
}

interface FullMotorSpecs extends MotorSpecs {
  resistance: Measurement;
  kV: Measurement;
  kT: Measurement;
}

export function completeMotorSpecs(specs: MotorSpecs): FullMotorSpecs {
  const resistance = specs.voltage.div(specs.stallCurrent);
  const kV = specs.freeSpeed.div(
    specs.voltage.sub(resistance.mul(specs.freeCurrent)),
  );
  const kT = specs.stallTorque.div(specs.stallCurrent);

  return {
    ...specs,
    resistance,
    kV,
    kT,
  };
}

interface MotorCurveSnapshot {
  speedPercentage: Measurement;
  speed: Measurement;
  freeCurrent: Measurement;
  maxStator: Measurement;
  statorCurrent: Measurement;
  torque: Measurement;
  outputPower: Measurement;
  losses: Measurement;
  efficiency: Measurement;
}

export function generateMotorCurves(
  specs: FullMotorSpecs,
  statorLimit: Measurement,
  supplyLimit: Measurement,
): MotorCurveSnapshot[] {
  const curve: MotorCurveSnapshot[] = [];
  let currentSpeed = new Measurement(0, 'rpm');

  if ([specs.voltage, statorLimit, supplyLimit].some((s) => s.scalar === 0)) {
    return [];
  }

  while (currentSpeed.lte(specs.freeSpeed)) {
    const speedPercentage = currentSpeed.div(specs.freeSpeed);
    const oneMinusSpeedPercentage = new Measurement(1).sub(speedPercentage);

    const freeCurrent = specs.freeCurrent.mul(speedPercentage);

    // max stator
    const maxPowerIn = specs.voltage.mul(supplyLimit);
    const resistance = specs.resistance.to('Ohm');
    const voltagePercentage = speedPercentage.mul(specs.voltage);
    const c = maxPowerIn.negate().add(specs.voltage.mul(freeCurrent));
    const discriminant = voltagePercentage
      .mul(voltagePercentage)
      .sub(resistance.mul(c).mul(4));
    const sqrtDiscriminant = new Measurement(
      Math.sqrt(discriminant.to('V2').scalar),
      'V',
    );
    const numerator = voltagePercentage.negate().add(sqrtDiscriminant);
    const denominator = resistance.mul(2);
    const maxStator = numerator.div(denominator).abs();
    // end max stator

    // stator current
    const innerMin = Measurement.min(
      statorLimit,
      oneMinusSpeedPercentage.mul(specs.stallCurrent),
    );
    const max = Measurement.max(innerMin, new Measurement(0, 'A'));
    const outerMin = Measurement.min(max, maxStator.sub(freeCurrent));
    const statorCurrent = outerMin;
    // end stator current

    const torque = statorCurrent.mul(specs.kT);
    const outputPower = torque.mul(currentSpeed).removeRad();
    const losses = statorCurrent
      .mul(statorCurrent)
      .mul(specs.resistance)
      .add(specs.voltage.mul(freeCurrent));

    const efficiency = outputPower.div(outputPower.add(losses));

    curve.push({
      efficiency,
      freeCurrent,
      maxStator,
      losses,
      outputPower,
      speed: currentSpeed,
      speedPercentage,
      statorCurrent,
      torque,
    });

    currentSpeed = currentSpeed.add(new Measurement(10, 'rpm'));
  }

  return curve;
}

export interface MotorDict extends Record<string, unknown> {
  name: string;
  quantity: number;
}

export default class Motor extends Model {
  public readonly kV: Measurement;
  public readonly kT: Measurement;
  public readonly kM: Measurement;
  // public readonly maxPower: Measurement;
  public readonly resistance: Measurement;
  public readonly b: Measurement;

  constructor(
    identifier: string,
    public readonly freeSpeed: Measurement,
    public readonly stallTorque: Measurement,
    public readonly stallCurrent: Measurement,
    public readonly freeCurrent: Measurement,
    public readonly voltage: Measurement,
    public readonly quantity: number,
  ) {
    super(identifier);

    this.resistance = this.voltage.div(this.stallCurrent);

    this.kV = this.freeSpeed.div(
      this.voltage.sub(this.resistance.mul(this.freeCurrent)),
    );
    this.kT = this.stallTorque.div(this.stallCurrent);
    this.kM = new Measurement(
      this.kT.scalar / Math.sqrt(this.resistance.scalar),
    );
    this.b = this.kT.mul(this.freeCurrent).div(this.freeSpeed);

    // this.maxPower = new MotorRules(this, highCurrentLimit, {
    //   voltage: nominalVoltage,
    //   rpm: this.freeSpeed.div(2),
    //   torque: this.stallTorque.div(2),
    // }).solve().power;
  }

  public static fromSpecs(specs: MotorSpecs, quantity: number) {
    return new Motor(
      specs.name,
      specs.freeSpeed,
      specs.stallTorque,
      specs.stallCurrent,
      specs.freeCurrent,
      specs.voltage,
      quantity,
    );
  }

  public static fromName(name: string, quantity: number) {
    return this.fromSpecs(ALL_MOTORS.find((m) => m.name === name)!, quantity);
  }

  public static KrakenX60sFOC(quantity: number) {
    return this.fromName('Kraken X60 (FOC)', quantity);
  }

  public static KrakenX60(quantity: number) {
    return this.fromName('Kraken X60', quantity);
  }

  public static Falcon500(quantity: number) {
    return this.fromName('Falcon 500', quantity);
  }

  public static NEO(quantity: number) {
    return this.fromName('NEO', quantity);
  }

  toDict(): MotorDict {
    return {
      name: this.identifier,
      quantity: this.quantity,
    };
  }

  public static fromDict(dict: MotorDict): Motor {
    return Motor.fromName(dict.name, dict.quantity);
  }

  eq<M extends Model>(m: M): boolean {
    return m instanceof Motor && m.identifier === this.identifier;
  }
}

export const ALL_MOTORS: MotorSpecs[] = [
  {
    name: 'Kraken X60',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(7.157, 'N*m'),
    stallCurrent: new Measurement(374.383, 'A'),
    freeCurrent: new Measurement(2.83, 'A'),
    freeSpeed: new Measurement(6065, 'rpm'),
  },
  {
    name: 'Kraken X60 (FOC)',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(9.362, 'N*m'),
    stallCurrent: new Measurement(476.098, 'A'),
    freeCurrent: new Measurement(3.496, 'A'),
    freeSpeed: new Measurement(5784, 'rpm'),
  },
  {
    name: 'NEO Vortex',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(5.957, 'N*m'),
    stallCurrent: new Measurement(391.091, 'A'),
    freeCurrent: new Measurement(5.434, 'A'),
    freeSpeed: new Measurement(6825, 'rpm'),
  },
  {
    name: 'NEO',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(4.201, 'N*m'),
    stallCurrent: new Measurement(216.269, 'A'),
    freeCurrent: new Measurement(1.782, 'A'),
    freeSpeed: new Measurement(5906, 'rpm'),
  },
  {
    name: 'Kraken X44',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(4.113, 'N*m'),
    stallCurrent: new Measurement(279.099, 'A'),
    freeCurrent: new Measurement(3.156, 'A'),
    freeSpeed: new Measurement(7757, 'rpm'),
  },
  {
    name: 'Kraken X44 (FOC)',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(5.011, 'N*m'),
    stallCurrent: new Measurement(329.188, 'A'),
    freeCurrent: new Measurement(3.231, 'A'),
    freeSpeed: new Measurement(7367, 'rpm'),
  },
  {
    name: 'Falcon 500',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(4.69, 'N*m'),
    stallCurrent: new Measurement(257, 'A'),
    freeCurrent: new Measurement(1.5, 'A'),
    freeSpeed: new Measurement(6380, 'rpm'),
  },
  {
    name: 'Falcon 500 (FOC)',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(5.84, 'N*m'),
    stallCurrent: new Measurement(304, 'A'),
    freeCurrent: new Measurement(1.5, 'A'),
    freeSpeed: new Measurement(6080, 'rpm'),
  },
  {
    name: 'Minion',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(3.173, 'N*m'),
    stallCurrent: new Measurement(211.607, 'A'),
    freeCurrent: new Measurement(2.206, 'A'),
    freeSpeed: new Measurement(7703, 'rpm'),
  },
  {
    name: 'Minion (Adv Hall)',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(3.201, 'N*m'),
    stallCurrent: new Measurement(207.18, 'A'),
    freeCurrent: new Measurement(2.384, 'A'),
    freeSpeed: new Measurement(7644, 'rpm'),
  },
  {
    name: 'Thrifty Pulsar',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(3.1, 'N*m'),
    stallCurrent: new Measurement(189, 'A'),
    freeCurrent: new Measurement(1, 'A'),
    freeSpeed: new Measurement(7500, 'rpm'),
  },
  {
    name: 'NEO 550',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(1.08, 'N*m'),
    stallCurrent: new Measurement(111, 'A'),
    freeCurrent: new Measurement(1.1, 'A'),
    freeSpeed: new Measurement(11710, 'rpm'),
  },
  {
    name: '775pro',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(0.71, 'N*m'),
    stallCurrent: new Measurement(134, 'A'),
    freeCurrent: new Measurement(0.7, 'A'),
    freeSpeed: new Measurement(18730, 'rpm'),
  },
  {
    name: '775 RedLine',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(0.64, 'N*m'),
    stallCurrent: new Measurement(122, 'A'),
    freeCurrent: new Measurement(2.6, 'A'),
    freeSpeed: new Measurement(19500, 'rpm'),
  },
  {
    name: 'CIM',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(2.41, 'N*m'),
    stallCurrent: new Measurement(131, 'A'),
    freeCurrent: new Measurement(2.7, 'A'),
    freeSpeed: new Measurement(5330, 'rpm'),
  },
  {
    name: 'MiniCIM',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(1.41, 'N*m'),
    stallCurrent: new Measurement(89, 'A'),
    freeCurrent: new Measurement(3, 'A'),
    freeSpeed: new Measurement(5840, 'rpm'),
  },
  {
    name: 'BAG',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(0.43, 'N*m'),
    stallCurrent: new Measurement(53, 'A'),
    freeCurrent: new Measurement(1.8, 'A'),
    freeSpeed: new Measurement(13180, 'rpm'),
  },
  {
    name: 'AM-9015',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(0.36, 'N*m'),
    stallCurrent: new Measurement(71, 'A'),
    freeCurrent: new Measurement(3.7, 'A'),
    freeSpeed: new Measurement(14270, 'rpm'),
  },
  {
    name: 'BaneBots 550',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(0.488, 'N*m'),
    stallCurrent: new Measurement(85, 'A'),
    freeCurrent: new Measurement(1.4, 'A'),
    freeSpeed: new Measurement(19300, 'rpm'),
  },
  {
    name: 'NeveRest',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(0.173, 'N*m'),
    stallCurrent: new Measurement(9.8, 'A'),
    freeCurrent: new Measurement(0.355, 'A'),
    freeSpeed: new Measurement(5480, 'rpm'),
  },
  {
    name: 'Snowblower',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(7.90893775, 'N*m'),
    stallCurrent: new Measurement(24, 'A'),
    freeCurrent: new Measurement(5, 'A'),
    freeSpeed: new Measurement(100, 'rpm'),
  },
  {
    name: 'HD Hex',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(0.105, 'N*m'),
    stallCurrent: new Measurement(8.5, 'A'),
    freeCurrent: new Measurement(0.4, 'A'),
    freeSpeed: new Measurement(6000, 'rpm'),
  },
  {
    name: 'Core Hex',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(3.2, 'N*m'),
    stallCurrent: new Measurement(4.4, 'A'),
    freeCurrent: new Measurement(0.5, 'A'),
    freeSpeed: new Measurement(125, 'rpm'),
  },
  {
    name: 'V5 Smart Motor (Red)',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(2.1, 'N*m'),
    stallCurrent: new Measurement(2.5, 'A'),
    freeCurrent: new Measurement(0.9, 'A'),
    freeSpeed: new Measurement(100, 'rpm'),
  },
  {
    name: 'Modern Robotics',
    voltage: new Measurement(12, 'V'),
    stallTorque: new Measurement(0.19, 'N*m'),
    stallCurrent: new Measurement(11, 'A'),
    freeCurrent: new Measurement(0.3, 'A'),
    freeSpeed: new Measurement(5900, 'rpm'),
  },
];
