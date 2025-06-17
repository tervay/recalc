import Model from "common/models/Model";
import Qty from "js-quantities";
import maxBy from "lodash/maxBy";

export type RawMeasurementJson = {
  readonly magnitude: number;
  readonly unit: string;
};

export type MeasurementDict = {
  readonly s: number;
  readonly u: string;
};

type Operand = Measurement | number;

export default class Measurement extends Model {
  private innerQty: Qty;

  constructor(magnitude: number, units?: string) {
    super("Measurement");
    this.innerQty =
      units === undefined ? Qty(magnitude) : Qty(magnitude, units);
  }

  private static fromQty(qty: Qty): Measurement {
    return new Measurement(qty.scalar, qty.units());
  }

  static min(m1: Measurement, m2: Measurement): Measurement {
    return m1.lt(m2) ? m1 : m2;
  }

  static max(m1: Measurement, m2: Measurement): Measurement {
    return m1.gt(m2) ? m1 : m2;
  }

  static maxAll(ms: Measurement[]): Measurement {
    return maxBy(ms, (a) => a.baseScalar)!;
  }

  static simplify(qty: Qty): Qty {
    const preferred: { [key: string]: string } = {
      resistance: "ohm",
      time: "s",
      mass: "lbs",
      length: "in",
      area: "in^2",
      angular_velocity: "rpm",
      energy: "J",
      current: "A",
      potential: "V",
      power: "W",
      pressure: "psi",
      density: "g/cm3",
      force: "N",
    };

    return qty.kind() in preferred ? qty.to(preferred[qty.kind()]) : qty;
  }

  static choices(m: Measurement): string[] {
    const kind = m.kind();
    switch (kind) {
      case "length":
        return ["in", "ft", "mm", "cm", "m"];
      case "mass":
        return ["oz", "lbs", "g", "kg"];
      case "area":
        return ["in^2", "ft^2", "mm^2", "cm^2", "m^2"];
      case "volume":
        return ["in^3", "ft^3", "mm^3", "cm^3", "m^3"];
      case "speed":
        return ["in/s", "ft/s", "mph", "m/s", "kph"];
      case "time":
        return ["s", "ms", "min", "hr"];
      case "pressure":
        return ["psi", "Pa"];
      case "current":
        return ["A"];
      case "potential":
        return ["V"];
      case "resistance":
        return ["ohm"];
      case "energy":
        return ["J"];
      case "force":
        return ["N", "lbf"];
      case "frequency":
        return ["Hz"];
      case "angle":
        return ["rad", "deg", "rotation"];
      case "angular_velocity":
        return ["rpm", "rad/s", "rotation/s", "deg/s"];
      case "power":
        return ["W", "hp"];
      case "acceleration":
        return ["in/s2", "ft/s2", "m/s2"];
    }

    if (m.kind() === undefined) {
      if (m.innerQty.isCompatible(Qty(1, "in^2 * lbs"))) {
        // Moment of inertia
        return ["in^2 lbs", "kg m^2"];
      } else if (m.innerQty.isCompatible("V/m")) {
        // position kP (linear)
        return ["V/m", "V/ft", "V/in"];
      } else if (m.innerQty.isCompatible("V*s/m")) {
        // kV, position kD, velocity kP (linear)
        return ["V*s/m", "V*s/ft", "V*s/in"];
      } else if (m.innerQty.isCompatible("V*s^2/m")) {
        // kA (linear)
        return ["V*s^2/m", "V*s^2/ft", "V*s^2/in"];
      } else if (m.innerQty.isCompatible("V/rad")) {
        // position kP (angular)
        return ["V/rad", "V/deg", "V/rotation"];
      } else if (m.innerQty.isCompatible("V*s/rad")) {
        // kV, position kD, velocity kP (angular)
        return ["V*s/rad", "V*s/deg", "V*s/rotation"];
      } else if (m.innerQty.isCompatible("V*s^2/rad")) {
        // kA (angular)
        return ["V*s^2/rad", "V*s^2/deg", "V*s^2/rotation"];
      } else if (m.innerQty.isCompatible("V/s")) {
        return ["V/s"];
      } else if (m.innerQty.isCompatible("A*h")) {
        return ["A*h"];
      }
    }

    return [];
  }

  add(m: Operand): Measurement {
    if (m instanceof Measurement) {
      return Measurement.fromQty(this.innerQty.add(m.innerQty));
    } else {
      return new Measurement(this.scalar + m, this.units());
    }
  }

  sub(m: Operand): Measurement {
    if (m instanceof Measurement) {
      return Measurement.fromQty(this.innerQty.sub(m.innerQty));
    } else {
      return new Measurement(this.scalar - m, this.units());
    }
  }

  mul(m: Operand): Measurement {
    if (m instanceof Measurement) {
      return Measurement.fromQty(this.innerQty.mul(m.innerQty));
    } else {
      return new Measurement(this.scalar * m, this.units());
    }
  }

  div(m: Operand): Measurement {
    if (m instanceof Measurement) {
      return Measurement.fromQty(this.innerQty.div(m.innerQty));
    } else {
      return new Measurement(this.scalar / m, this.units());
    }
  }

  lt(m: Measurement): boolean {
    return this.innerQty.lt(m.innerQty);
  }

  lte(m: Measurement): boolean {
    return this.innerQty.lte(m.innerQty);
  }

  gt(m: Measurement): boolean {
    return this.innerQty.gt(m.innerQty);
  }

  gte(m: Measurement): boolean {
    return this.innerQty.gte(m.innerQty);
  }

  eq(m: Model): boolean {
    return m instanceof Measurement && this.innerQty.eq(m.innerQty);
  }

  static fromDict(dict: MeasurementDict): Measurement {
    return new Measurement(dict.s, dict.u);
  }

  copy(): Measurement {
    return new Measurement(this.scalar, this.units());
  }

  to(units: string): Measurement {
    return Measurement.fromQty(this.innerQty.to(units));
  }

  toBase(): Measurement {
    this.innerQty = this.innerQty.toBase();
    return this;
  }

  clamp(floor: Measurement, ceiling: Measurement): Measurement {
    if (this.lt(floor)) {
      return floor;
    }
    if (this.gt(ceiling)) {
      return ceiling;
    }

    return this;
  }

  inverse(): Measurement {
    return Measurement.fromQty(this.innerQty.inverse());
  }

  abs(): Measurement {
    return new Measurement(Math.abs(this.scalar), this.units());
  }

  negate(): Measurement {
    return new Measurement(-this.scalar, this.units());
  }

  removeRad(): Measurement {
    return this.div(new Measurement(1, "rad"));
  }

  forcePositive(): Measurement {
    return new Measurement(Math.max(0, this.scalar), this.units());
  }

  round(n: number): Measurement {
    return new Measurement(Number(this.scalar.toFixed(n)), this.units());
  }

  toPrecision(n: number): Measurement {
    return Measurement.fromQty(this.innerQty.toPrec(n));
  }

  units(): string {
    return this.innerQty.units();
  }

  get scalar(): number {
    return this.innerQty.scalar;
  }

  get baseScalar(): number {
    return this.innerQty.baseScalar;
  }

  sign(): number {
    return Math.sign(this.scalar);
  }

  kind(): string {
    return this.innerQty.kind();
  }

  format(): string {
    return this.innerQty.format();
  }

  toString(): string {
    return this.format();
  }

  toDict(): MeasurementDict {
    return {
      s: this.scalar,
      u: this.units(),
    };
  }

  toJSON(): MeasurementDict {
    return this.toDict();
  }

  static get GRAVITY(): Measurement {
    return new Measurement(-9.81, "m/s^2");
  }

  static fromRawJson(json: RawMeasurementJson): Measurement {
    return new Measurement(json.magnitude, json.unit);
  }

  static anyAreZero(...measurements: (Measurement | number)[]): boolean {
    return measurements
      .map((m) => (m instanceof Measurement ? m.scalar === 0 : m === 0))
      .includes(true);
  }

  static clarifyUnit(unit: string): string {
    switch (unit) {
      case "in2":
        return "in^2";
      case "ft2":
        return "ft^2";
      case "mm2":
        return "mm^2";
      case "cm2":
        return "cm^2";
      case "m2":
        return "m^2";
      case "in3":
        return "in^3";
      case "ft3":
        return "ft^3";
      case "mm3":
        return "mm^3";
      case "cm3":
        return "cm^3";
      case "m3":
        return "m^3";
    }

    return unit;
  }

  static CIRCLE_RIGHT(): Measurement {
    return new Measurement(0, "deg");
  }
  static CIRCLE_UP(): Measurement {
    return new Measurement(90, "deg");
  }
  static CIRCLE_LEFT(): Measurement {
    return new Measurement(180, "deg");
  }
  static CIRCLE_DOWN(): Measurement {
    return new Measurement(270, "deg");
  }
  static CIRCLE_UP_RIGHT(): Measurement {
    return new Measurement(45, "deg");
  }
  static CIRCLE_UP_LEFT(): Measurement {
    return new Measurement(135, "deg");
  }
  static CIRCLE_DOWN_RIGHT(): Measurement {
    return new Measurement(225, "deg");
  }
  static CIRCLE_DOWN_LEFT(): Measurement {
    return new Measurement(315, "deg");
  }

  static STANDARD_BREAKER_ESTIMATE_I2T(): Measurement {
    return new Measurement(40, "A")
      .mul(new Measurement(40, "A"))
      .mul(new Measurement(10, "s"));
  }

  linearizeRadialPosition(inchesPerRevolution: Measurement): Measurement {
    return this.mul(inchesPerRevolution)
      .div(2 * Math.PI)
      .removeRad();
  }

  radializeLinearPosition(inchesPerRevolution: Measurement): Measurement {
    return this.div(inchesPerRevolution).mul(
      new Measurement(2 * Math.PI, "rad"),
    );
  }
}
