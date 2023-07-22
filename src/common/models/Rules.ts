/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Measurement from "common/models/Measurement";
import Motor, {
  CompleteMotorState,
  IncompleteMotorState,
  nominalVoltage,
} from "common/models/Motor";

type ConditionFn<T> = (source: T) => boolean;
type ModifyFn<T> = (source: T) => void;

class Rule<T> {
  constructor(
    public readonly name: string,
    public readonly conditionFn: ConditionFn<T>,
    public readonly modifyFn: ModifyFn<T>,
    public readonly haltAfter: boolean,
    public readonly priority: number,
  ) {}
}

export default class Rules<T> {
  public rules: Rule<T>[];

  constructor() {
    this.rules = [];
  }

  addRule(
    name: string,
    conditionFn: ConditionFn<T>,
    modifyFn: ModifyFn<T>,
    haltAfter = false,
    priority = 0,
  ): void {
    this.rules.push(new Rule(name, conditionFn, modifyFn, haltAfter, priority));
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  solve(source: T, iterationLimit = 100): void {
    let runLoop = true;
    let i = 0;

    while (runLoop && i <= iterationLimit) {
      let runForEach = true;
      // console.log('-----');
      this.rules.forEach((rule) => {
        if (!runForEach) {
          return;
        }
        // console.log('Checking ' + rule.name + ' (' + rule.priority + ')')
        if (rule.conditionFn(source)) {
          // console.log('Running ' + rule.name);
          rule.modifyFn(source);

          if (rule.haltAfter) {
            runLoop = false;
          }
          runForEach = false;
        }
      });
      i++;
    }
  }
}

type MotorRulesState = {
  motor: Motor;
  currentLimit: Measurement;
  rpm?: Measurement;
  current?: Measurement;
  torque?: Measurement;
  power?: Measurement;
  voltage?: Measurement;
  solved: boolean;
  didLimitTorque: boolean;
  didLimitCurrent: boolean;
  didLimitVoltage: boolean;
};

export class MotorRules {
  public motorState: IncompleteMotorState;
  private rulesState: MotorRulesState;
  private rules: Rules<MotorRulesState>;

  constructor(
    motor: Motor,
    currentLimit: Measurement,
    motorState: IncompleteMotorState,
  ) {
    this.motorState = motorState;
    this.rulesState = {
      ...motorState,
      motor: motor,
      currentLimit: currentLimit,
      solved: false,
      didLimitCurrent: false,
      didLimitTorque: false,
      didLimitVoltage: false,
    };
    this.rules = MotorRules.createRules();
  }

  solve(): CompleteMotorState {
    this.rules.solve(this.rulesState);
    if (!this.rulesState.solved) {
      throw Error("Could not solve motor state!");
    }

    return {
      current: this.rulesState.current!,
      power: this.rulesState.power!,
      rpm: this.rulesState.rpm!,
      torque: this.rulesState.torque!,
      voltage: this.rulesState.voltage!,
    };
  }

  static createRules(): Rules<MotorRulesState> {
    const rules = new Rules<MotorRulesState>();
    rules.addRule(
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
      1,
    );
    rules.addRule(
      "Current -> torque",
      (m) => m.current !== undefined && m.torque === undefined,
      (m) => {
        m.torque = m.motor.kT
          .mul(m.current!.sub(m.motor.freeCurrent))
          .forcePositive();
      },
    );
    rules.addRule(
      "Torque -> current",
      (m) => m.torque !== undefined && m.current === undefined,
      (m) => {
        m.current = m.torque!.div(m.motor.kT).forcePositive();
      },
    );
    rules.addRule(
      "Limit torque due to current limit",
      (m) =>
        !m.didLimitTorque &&
        m.torque !== undefined &&
        m.currentLimit !== undefined,
      (m) => {
        m.torque = Measurement.min(
          m.torque!,
          m.currentLimit.mul(m.motor.kT),
        ).forcePositive();
        m.didLimitTorque = true;
      },
      false,
      2,
    );
    rules.addRule(
      "Limit current due to current limit",
      (m) =>
        !m.didLimitCurrent &&
        m.current !== undefined &&
        m.currentLimit !== undefined,
      (m) => {
        m.current = Measurement.min(m.current!, m.currentLimit).forcePositive();
        m.didLimitCurrent = true;
      },
      false,
      2,
    );

    rules.addRule(
      "Given voltage and rpm, calculate current",
      (m) =>
        m.voltage !== undefined &&
        m.rpm !== undefined &&
        m.current === undefined,
      (m) => {
        // V = (I - I_f) * R + w * kE ; solve for I
        // V - w * kE = (I - I_f) R
        // (V - w * kE) / R = (I - I_f)
        // (V - w * kE) / R + I_f = I
        m.current = m
          .voltage!.sub(m.rpm!.div(m.motor.kV))
          .div(m.motor.resistance)
          // .add(m.motor.freeCurrent)
          .forcePositive();
      },
    );

    rules.addRule(
      "Given rpm and torque, calculate power",
      (m) =>
        m.rpm !== undefined && m.torque !== undefined && m.power === undefined,
      (m) => {
        m.power = m.rpm!.mul(m.torque!).removeRad().forcePositive();
      },
    );

    rules.addRule(
      "Given rpm and current, calculate voltage",
      (m) =>
        m.rpm !== undefined &&
        m.current !== undefined &&
        m.voltage === undefined,
      (m) => {
        m.voltage = m
          .current!.sub(m.motor.freeCurrent)
          .mul(m.motor.resistance)
          .add(m.rpm!.div(m.motor.kV))
          .forcePositive();
      },
    );

    rules.addRule(
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
      3,
    );

    rules.addRule(
      "Given voltage and current, calculate rpm",
      (m) =>
        m.current !== undefined &&
        m.voltage !== undefined &&
        m.rpm === undefined,
      (m) => {
        // V = IR + w * kE ; solve for w
        // V - IR = w * kE
        // w = (V - (I)R) / kE
        m.rpm = m
          .voltage!.sub(m.current!.mul(m.motor.resistance))
          .mul(m.motor.kV)
          .forcePositive();
      },
    );

    rules.addRule(
      "Given torque and power, calculate rpm",
      (m) =>
        m.torque !== undefined && m.power !== undefined && m.rpm === undefined,
      (m) => {
        m.rpm = m
          .power!.div(m.torque!)
          .mul(new Measurement(1, "rad"))
          .forcePositive();
      },
    );

    rules.addRule(
      "Given zero motors, break",
      (m) => m.motor.quantity === 0,
      (m) => {
        m.solved = true;
        m.current = new Measurement(0, "A");
        m.power = new Measurement(0, "W");
        m.rpm = new Measurement(0, "rpm");
        m.torque = new Measurement(0, "N*m");
        m.voltage = new Measurement(0, "V");
      },
      true,
      1,
    );

    return rules;
  }
}
