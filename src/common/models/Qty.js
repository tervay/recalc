import Model from "common/tooling/abc/Model";
import JSQty from "js-quantities";

export default class Qty extends Model {
  constructor(magnitude, units) {
    super();
    this.innerQty = JSQty(magnitude, units);

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
      this[fName] = (qty_) => {
        if (!(qty_ instanceof Qty)) {
          qty_ = new Qty(qty_);
        }

        const jsQtyResult = this.innerQty[fName](qty_.innerQty);
        if (jsQtyResult.constructor.name === "Qty") {
          return Qty.simplify(new Qty(jsQtyResult.scalar, jsQtyResult.units()));
        } else {
          return jsQtyResult;
        }
      };
    });
  }

  static simplify(qty) {
    const allowedUnits = [
      "ft3/min",
      "lb",
      "psi",
      "rpm",
      "N*m",
      "A",
      "W",
      "W/lb",
      "ohm",
      "N*m/A",
      "rpm/V",
      "g/m3",
      "kJ/m2",
      "ft/s",
      "mL",
    ];

    let returnValue = qty;
    allowedUnits.forEach((unit) => {
      if (qty.innerQty.isCompatible(JSQty(1, unit))) {
        returnValue = qty.to(unit);
      }
    });

    return returnValue;
  }

  to(units) {
    this.innerQty = this.innerQty.to(units);
    return this;
  }

  units() {
    return this.innerQty.units();
  }

  get scalar() {
    return this.innerQty.scalar;
  }

  get baseScalar() {
    return this.innerQty.baseScalar;
  }

  toDict() {
    return {
      s: this.innerQty.scalar,
      u: this.innerQty.units(),
    };
  }

  static fromDict(dict) {
    return new Qty(Number(dict.s), dict.u);
  }

  copy() {
    return new Qty(this.innerQty.scalar, this.innerQty.units());
  }
}
