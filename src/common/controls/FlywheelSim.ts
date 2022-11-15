import LinearSystem from "common/controls/LinearSystem";
import { Nats } from "common/controls/Matrix";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";

export default class FlywheelSim {
  private model: LinearSystem<Nats<1>, Nats<1>, Nats<1>>;

  constructor(motor: Motor, moi: Measurement, ratio: Ratio) {
    this.model = LinearSystem.createFlywheelSystem(motor, moi, ratio);
  }

  getAngularVelocity(): Measurement {}
}
