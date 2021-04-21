import Model from "common/models/Model";
import Qty from "js-quantities";

export default class Measurement extends Model {
  /**
   * Should not be used outside the Measurement class!
   * @param {Qty} qty - The js-quantities object to store internally.
   * @returns {Measurement} a new Measurement instance.
   */
  static fromQty(qty) {
    return new Measurement(qty.scalar, qty.units());
  }

  static get GRAVITY() {
    return new Measurement(-9.81, "m/s^2");
  }

  /**
   *
   * @param {number} magnitude - Magnitude of the measurement
   * @param {string=} units - Units of the measurement (optional)
   */
  constructor(magnitude, units) {
    super();
    this.innerQty = Measurement.simplify(Qty(magnitude, units));

    // Intellisense stubs
    this.add = () => {};
    this.sub = () => {};
    this.mul = () => {};
    this.div = () => {};
    this.eq = () => {};
    this.same = () => {};
    this.lt = () => {};
    this.lte = () => {};
    this.gt = () => {};
    this.gte = () => {};
    this.compareTo = () => {};

    [
      "add",
      "sub",
      "mul",
      "div",
      "eq",
      "same",
      "lt",
      "lte",
      "gt",
      "gte",
      "compareTo",
    ].forEach((fName) => {
      this[fName] = (measurement_) => {
        if (!(measurement_ instanceof Measurement)) {
          measurement_ = new Measurement(measurement_);
        }

        const jsQtyResult = this.innerQty[fName](measurement_.innerQty);
        if (jsQtyResult instanceof Qty) {
          return Measurement.fromQty(jsQtyResult);
        } else {
          return jsQtyResult;
        }
      };
    });
  }

  /**
   * Simplify the units of the given Qty to something we prefer.
   * Should not be called outside Measurement class!
   *
   * @param qty - js-quantities object to simplify.
   * @returns {Qty} The same object, either qty or qty.to( ... )
   */
  static simplify(qty) {
    const preferred = {
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

  /**
   * Cast the measurement to another unit.
   * @param {string} units - Units to cast the measurement to.
   * @returns {Measurement} this (same instance)
   */
  to(units) {
    this.innerQty = this.innerQty.to(units);
    return this;
  }

  /**
   *
   * @returns {string} Retrieve the units of the measurement
   */
  units() {
    return this.innerQty.units();
  }

  /**
   *
   * @returns {number} The scalar of the measurement in its current units
   */
  get scalar() {
    return this.innerQty.scalar;
  }

  /**
   *
   * @returns {number} The scalar of the measurement in its most simplified units
   */
  get baseScalar() {
    return this.innerQty.baseScalar;
  }

  kind() {
    return this.innerQty.kind();
  }

  toDict() {
    return {
      s: this.innerQty.scalar,
      u: this.innerQty.units(),
    };
  }

  static fromDict(dict) {
    return new Measurement(Number(dict.s), dict.u);
  }

  /**
   *
   * @returns {Measurement} A copy of itself (new instance)
   */
  copy() {
    return new Measurement(this.innerQty.scalar, this.innerQty.units());
  }

  format() {
    return this.innerQty.format(...arguments);
  }

  toBase() {
    return new Measurement(
      this.innerQty.baseScalar,
      this.innerQty.toBase().units()
    );
  }

  clamp(floor, ceiling) {
    if (this.lt(floor)) {
      return floor;
    }
    if (this.gt(ceiling)) {
      return ceiling;
    }
    return this;
  }

  inverse() {
    const inverseQty = this.innerQty.inverse();
    return new Measurement(inverseQty.scalar, inverseQty.units());
  }

  abs() {
    return new Measurement(Math.abs(this.scalar), this.units());
  }

  sign() {
    return Math.sign(this.scalar);
  }

  negate() {
    return new Measurement(-this.scalar, this.units());
  }

  removeRad() {
    return this.div(new Measurement(1, "rad"));
  }

  static min(m1, m2) {
    return m1.lt(m2) ? m1 : m2;
  }

  static max(m1, m2) {
    return m1.gt(m2) ? m1 : m2;
  }

  toString() {
    return this.format();
  }

  forcePositive() {
    return new Measurement(Math.max(0, this.scalar), this.units());
  }

  round(n) {
    return new Measurement(Number(this.scalar.toFixed(n)), this.units());
  }
}
