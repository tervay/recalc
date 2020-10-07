import Measurement from "common/models/Measurement";
import Model from "common/tooling/abc/Model";
import { fit } from "common/tooling/math";
import keyBy from "lodash/keyBy";

export default class Motor extends Model {
  /**
   *
   * @param {number} quantity - number of motors in the gearbox
   * @param {string} name - the specific motor name
   */
  constructor(quantity, name) {
    super(name, motorMap);
    this.quantity = quantity;
    this.kV = this.freeSpeed.div(new Measurement(12, "V"));
    this.kT = this.stallTorque.div(this.stallCurrent.sub(this.freeCurrent));
    if (this.name !== "Falcon 500") {
      this.weight = this.weight.add(new Measurement(0.25, "lbs"));
    }

    this.maxPower = this.getPower(
      this.stallCurrent.div(2),
      this.freeSpeed.div(2)
    );
    this.resistance = new Measurement(12, "V").div(this.stallCurrent);
  }

  /**
   *
   * @param {Measurement} current - The current draw of the motor
   * @returns {Measurement} the rpm of the motor, at the specific current draw, assuming 12v
   */
  getRPM(current) {
    if (current.gt(this.stallCurrent)) {
      return new Measurement(-1, "rpm");
    }

    return new Measurement(
      fit(
        [this.stallCurrent.to("A").scalar, 0],
        [this.freeCurrent.to("A").scalar, this.freeSpeed.to("rpm").scalar]
      )(current.to("A").scalar),
      "rpm"
    );
  }

  getTorque(rpm) {
    return new Measurement(
      fit([0, this.stallTorque.scalar], [this.freeSpeed.scalar, 0])(rpm.scalar),
      "J"
    );
  }

  /**
   *
   * @param {Measurement} current - The current draw of the motor
   * @returns {Measurement} The power of the motor, at the specific current draw, assuming 12v
   */
  getPower(current) {
    const rpm = this.getRPM(current);
    if (rpm.to("rpm").scalar === -1) {
      return new Measurement(-1, "W");
    }

    const torque = this.kT.mul(current);
    return rpm.mul(torque).mul(new Measurement(1, "1/rad"));
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
}

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
      freeSpeed: new Measurement(5676, "rpm"),
      stallTorque: new Measurement(2.6, "N*m"),
      stallCurrent: new Measurement(105, "A"),
      freeCurrent: new Measurement(1.8, "A"),
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
      freeSpeed: new Measurement(11000, "rpm"),
      stallTorque: new Measurement(0.97, "N*m"),
      stallCurrent: new Measurement(100, "A"),
      freeCurrent: new Measurement(1.4, "A"),
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
      freeSpeed: new Measurement(16000, "rpm"),
      stallTorque: new Measurement(0.428, "N*m"),
      stallCurrent: new Measurement(63.8, "A"),
      freeCurrent: new Measurement(1.2, "A"),
      weight: new Measurement(0.5, "lb"),
      url: "https://www.andymark.com/products/9015-motor",
    },
    {
      name: "NeveRest",
      freeSpeed: new Measurement(6600, "rpm"),
      stallTorque: new Measurement(0.06178858, "N*m"),
      stallCurrent: new Measurement(11.5, "A"),
      freeCurrent: new Measurement(0.4, "A"),
      weight: new Measurement(0.587, "lb"),
      url: "https://www.andymark.com/products/neverest-series-motor-only",
    },
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
      freeSpeed: new Measurement(21020, "rpm"),
      stallTorque: new Measurement(0.7, "N*m"),
      stallCurrent: new Measurement(130, "A"),
      freeCurrent: new Measurement(3.8, "A"),
      weight: new Measurement(0.806, "lb"),
      url: "https://www.andymark.com/products/andymark-775-redline-motor-v2",
    },
  ],
  "name"
);
