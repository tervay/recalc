import Measurement from "common/models/Measurement";
import Model from "common/models/Model";
import Rules from "common/models/Rules";
import keyBy from "lodash/keyBy";

export const nominalVoltage = new Measurement(12, "V");
const highCurrentLimit = new Measurement(1000, "A");

export default class Motor extends Model {
  /**
   *
   * @param {number} quantity - number of motors in the gearbox
   * @param {string} name - the specific motor name
   */
  constructor(quantity, name) {
    super(name, motorMap);
    this.quantity = quantity;
    this.kV = this.freeSpeed.div(nominalVoltage);
    this.kT = this.stallTorque.div(this.stallCurrent.sub(this.freeCurrent));
    this.maxPower = new MotorState(this, highCurrentLimit, {
      voltage: nominalVoltage,
      rpm: this.freeSpeed.div(2),
      torque: this.stallTorque.div(2),
    }).solve().power;

    this.resistance = nominalVoltage.div(this.stallCurrent);
  }

  static Falcon500s(quantity) {
    return new Motor(quantity, "Falcon 500");
  }

  static NEOs(quantity) {
    return new Motor(quantity, "NEO");
  }

  static NEO550s(quantity) {
    return new Motor(quantity, "NEO 550");
  }

  static CIMs(quantity) {
    return new Motor(quantity, "CIM");
  }

  static MiniCIMs(quantity) {
    return new Motor(quantity, "MiniCIM");
  }

  static BAGs(quantity) {
    return new Motor(quantity, "BAG");
  }

  static _775RedLines(quantity) {
    return new Motor(quantity, "775 RedLine");
  }

  static _775pros(quantity) {
    return new Motor(quantity, "775pro");
  }

  static AM9015s(quantity) {
    return new Motor(quantity, "AM-9015");
  }

  static NeveRests(quantity) {
    return new Motor(quantity, "NeveRest");
  }

  static Snowblowers(quantity) {
    return new Motor(quantity, "Snowblower");
  }

  toDict() {
    return {
      quantity: this.quantity,
      name: this.name,
    };
  }

  static fromDict(dict) {
    return new Motor(dict.quantity, dict.name);
  }

  static get choices() {
    return Object.keys(motorMap);
  }

  static getAllMotors() {
    return Object.keys(motorMap).map((n) => new Motor(1, n));
  }

  eq(motor) {
    if (!(motor instanceof Motor)) {
      return false;
    }

    return (
      this.quantity === motor.quantity &&
      this.name === motor.name &&
      // Verify that we did not ever somehow reach a state
      // where we set quantity and name but leave old motor
      // specs around.
      this.freeSpeed === motor.freeSpeed
    );
  }

  toString() {
    return `[${this.quantity} × ${this.name}]`;
  }
}

// Motor performance data taken from https://motors.vex.com/.
const motorMap = keyBy(
  [
    {
      name: "Falcon 500",
      freeSpeed: new Measurement(6380, "rpm"),
      stallTorque: new Measurement(4.69, "N*m"),
      stallCurrent: new Measurement(257, "A"),
      freeCurrent: new Measurement(1.5, "A"),
      weight: new Measurement(1.1, "lb"),
      url: "https://www.vexrobotics.com/217-6515.html",
    },
    {
      name: "NEO",
      freeSpeed: new Measurement(5880, "rpm"),
      stallTorque: new Measurement(3.36, "N*m"),
      stallCurrent: new Measurement(166, "A"),
      freeCurrent: new Measurement(1.3, "A"),
      weight: new Measurement(0.94, "lb"),
      url: "https://www.revrobotics.com/rev-21-1650/",
    },
    {
      name: "775pro",
      freeSpeed: new Measurement(18730, "rpm"),
      stallTorque: new Measurement(0.71, "N*m"),
      stallCurrent: new Measurement(134, "A"),
      freeCurrent: new Measurement(0.7, "A"),
      weight: new Measurement(0.8, "lb"),
      url: "https://www.vexrobotics.com/775pro.html",
    },
    {
      name: "NEO 550",
      freeSpeed: new Measurement(11710, "rpm"),
      stallTorque: new Measurement(1.08, "N*m"),
      stallCurrent: new Measurement(111, "A"),
      freeCurrent: new Measurement(1.1, "A"),
      weight: new Measurement(0.31, "lb"),
      url: "https://www.revrobotics.com/rev-21-1651/",
    },
    {
      name: "CIM",
      freeSpeed: new Measurement(5330, "rpm"),
      stallTorque: new Measurement(2.41, "N*m"),
      stallCurrent: new Measurement(131, "A"),
      freeCurrent: new Measurement(2.7, "A"),
      weight: new Measurement(2.82, "lb"),
      url: "https://www.vexrobotics.com/217-2000.html",
    },
    {
      name: "MiniCIM",
      freeSpeed: new Measurement(5840, "rpm"),
      stallTorque: new Measurement(1.41, "N*m"),
      stallCurrent: new Measurement(89, "A"),
      freeCurrent: new Measurement(3, "A"),
      weight: new Measurement(2.16, "lb"),
      url: "https://www.vexrobotics.com/217-3371.html",
    },
    {
      name: "BAG",
      freeSpeed: new Measurement(13180, "rpm"),
      stallTorque: new Measurement(0.43, "N*m"),
      stallCurrent: new Measurement(53, "A"),
      freeCurrent: new Measurement(1.8, "A"),
      weight: new Measurement(0.71, "lb"),
      url: "https://www.vexrobotics.com/217-3351.html",
    },
    {
      name: "AM-9015",
      freeSpeed: new Measurement(14270, "rpm"),
      stallTorque: new Measurement(0.36, "N*m"),
      stallCurrent: new Measurement(71, "A"),
      freeCurrent: new Measurement(3.7, "A"),
      weight: new Measurement(0.5, "lb"),
      url: "https://www.andymark.com/products/9015-motor",
    },
    {
      name: "NeveRest",
      freeSpeed: new Measurement(5480, "rpm"),
      stallTorque: new Measurement(0.173, "N*m"),
      stallCurrent: new Measurement(9.8, "A"),
      freeCurrent: new Measurement(0.355, "A"),
      weight: new Measurement(0.587, "lb"),
      url: "https://www.andymark.com/products/neverest-series-motor-only",
    },
    // No vex testing data exists for this motor so manufacturer specs are used.
    {
      name: "Snowblower",
      freeSpeed: new Measurement(100, "rpm"),
      stallTorque: new Measurement(7.90893775, "N*m"),
      stallCurrent: new Measurement(24, "A"),
      freeCurrent: new Measurement(5, "A"),
      weight: new Measurement(1.1, "lb"),
      url: "https://www.andymark.com/products/snow-blower-motor-with-hex-shaft",
    },
    {
      name: "775 RedLine",
      freeSpeed: new Measurement(19500, "rpm"),
      stallTorque: new Measurement(0.64, "N*m"),
      stallCurrent: new Measurement(122, "A"),
      freeCurrent: new Measurement(2.6, "A"),
      weight: new Measurement(0.806, "lb"),
      url: "https://www.andymark.com/products/andymark-775-redline-motor-v2",
    },
  ],
  "name"
);

export class MotorState {
  constructor(motor, currentLimit, state) {
    this.motor = motor;
    this.currentLimit = currentLimit;
    this.rpm = state.rpm;
    this.current = state.current;
    this.torque = state.torque;
    this.power = state.power;
    this.voltage = state.voltage;
    this.solved = false;
    this.didLimitTorque = false;
    this.didLimitCurrent = false;
    this.didLimitVoltage = false;
  }

  solve() {
    motorRules.solve(this);
    return this;
  }
}

/**
 *
 * kV = 1 / kE = 1 / kT
 *
 *
 * V = IR + w * kE
 * T = (I - I_free) * kT
 * P = wT
 * kV = w_free / V
 *
 */
export const motorRules = new Rules();
motorRules.addRule(
  "terminating condition",
  (m) =>
    m.current !== undefined &&
    m.torque !== undefined &&
    m.rpm !== undefined &&
    m.voltage !== undefined &&
    m.power !== undefined &&
    m.solved === false,
  (m) => {
    m.solved = true;
  },
  true,
  1
);
motorRules.addRule(
  "Current -> torque",
  (m) => m.current !== undefined && m.torque === undefined,
  (m) => {
    m.torque = m.motor.kT
      .mul(m.current.sub(m.motor.freeCurrent))
      .forcePositive();
  }
);
motorRules.addRule(
  "Torque -> current",
  (m) => m.torque !== undefined && m.current === undefined,
  (m) => {
    m.current = m.motor.freeCurrent
      .add(m.torque.div(m.motor.kT))
      .forcePositive();
  }
);
motorRules.addRule(
  "Limit torque due to current limit",
  (m) =>
    !m.didLimitTorque && m.torque !== undefined && m.currentLimit !== undefined,
  (m) => {
    m.torque = Measurement.min(
      m.torque,
      m.currentLimit.mul(m.motor.kT)
    ).forcePositive();
    m.didLimitTorque = true;
  },
  false,
  2
);
motorRules.addRule(
  "Limit current due to current limit",
  (m) =>
    !m.didLimitCurrent &&
    m.current !== undefined &&
    m.currentLimit !== undefined,
  (m) => {
    m.current = Measurement.min(m.current, m.currentLimit).forcePositive();
    m.didLimitCurrent = true;
  },
  false,
  2
);

motorRules.addRule(
  "Given voltage and rpm, calculate current",
  (m) =>
    m.voltage !== undefined && m.rpm !== undefined && m.current === undefined,
  (m) => {
    // V = IR + w * kE ; solve for I
    // V - w * kE = IR
    // (V - w * kE) / R = I
    m.current = m.voltage
      .sub(m.rpm.div(m.motor.kV))
      .div(m.motor.resistance)
      .forcePositive();
  }
);

motorRules.addRule(
  "Given rpm and torque, calculate power",
  (m) => m.rpm !== undefined && m.torque !== undefined && m.power === undefined,
  (m) => {
    m.power = m.rpm.mul(m.torque).removeRad().forcePositive();
  }
);

motorRules.addRule(
  "Given rpm and current, calculate voltage",
  (m) =>
    m.rpm !== undefined && m.current !== undefined && m.voltage === undefined,
  (m) => {
    m.voltage = m.current
      .mul(m.motor.resistance)
      .add(m.rpm.div(m.motor.kV))
      .forcePositive();
  }
);

motorRules.addRule(
  "If voltage is too high and current is present, wipe the state",
  (m) =>
    m.voltage !== undefined &&
    m.voltage.gt(nominalVoltage) &&
    m.current !== undefined,
  (m) => {
    m.voltage = nominalVoltage;
    m.rpm = undefined;
    m.torque = undefined;
    m.power = undefined;
    m.didLimitCurrent = false;
    m.didLimitTorque = false;
    m.didLimitVoltage = true;
  },
  false,
  3
);

motorRules.addRule(
  "Given voltage and current, calculate rpm",
  (m) =>
    m.current !== undefined && m.voltage !== undefined && m.rpm === undefined,
  (m) => {
    // V = IR + w * kE ; solve for w
    // V - IR = w * kE
    // w = (V - IR) / kE
    m.rpm = m.voltage
      .sub(m.current.mul(m.motor.resistance))
      .mul(m.motor.kV)
      .forcePositive();
  }
);

motorRules.addRule(
  "Given torque and power, calculate rpm",
  (m) => m.torque !== undefined && m.power !== undefined && m.rpm === undefined,
  (m) => {
    m.rpm = m.power
      .div(m.torque)
      .mul(new Measurement(1, "rad"))
      .forcePositive();
  }
);
