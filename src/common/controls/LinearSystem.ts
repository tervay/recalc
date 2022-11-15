import WpiMatrix, { Nats, Num, VecBuilder } from "common/controls/Matrix";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";
import Matrix from "ml-matrix";

export default class LinearSystem<
  States extends Num,
  Inputs extends Num,
  Outputs extends Num
> {
  private m_A: WpiMatrix<States, States>;
  private m_B: WpiMatrix<States, Inputs>;
  private m_C: WpiMatrix<Outputs, States>;
  private m_D: WpiMatrix<Outputs, Inputs>;

  constructor(
    A: WpiMatrix<States, States>,
    B: WpiMatrix<States, Inputs>,
    C: WpiMatrix<Outputs, States>,
    D: WpiMatrix<Outputs, Inputs>
  ) {
    this.m_A = A;
    this.m_B = B;
    this.m_C = C;
    this.m_D = D;
  }

  static createFlywheelSystem(
    motor: Motor,
    moi: Measurement,
    ratio: Ratio
  ): LinearSystem<Nats<1>, Nats<1>, Nats<1>> {
    return new LinearSystem(
      VecBuilder.fill(
        motor.kT
          .div(motor.kV.mul(motor.resistance).mul(moi))
          .mul(ratio.asNumber())
          .mul(ratio.asNumber())
          .negate().scalar
      ),
      VecBuilder.fill(motor.kT.div(motor.resistance.mul(moi)).scalar),
      new WpiMatrix(Matrix.eye(1)),
      new WpiMatrix({ rows: 1, cols: 1 })
    );
  }

  getA(): WpiMatrix<States, States> {
    return this.m_A;
  }
  getB(): WpiMatrix<States, Inputs> {
    return this.m_B;
  }
  getC(): WpiMatrix<Outputs, States> {
    return this.m_C;
  }
  getD(): WpiMatrix<Outputs, Inputs> {
    return this.m_D;
  }
}

export class LinearSystemSim<
  States extends Num,
  Inputs extends Num,
  Outputs extends Num
> {
  plant: LinearSystem<States, Inputs, Outputs>;
  m_x: WpiMatrix<States, Nats<1>>;
  m_y: WpiMatrix<Outputs, Nats<1>>;
  m_u: WpiMatrix<Inputs, Nats<1>>;

  constructor(system: LinearSystem<States, Inputs, Outputs>) {
    this.plant = system;

    this.m_x = new WpiMatrix(new Matrix(system.getA().getNumRows(), 1));
    this.m_u = new WpiMatrix(new Matrix(system.getB().getNumCols(), 1));
    this.m_y = new WpiMatrix(new Matrix(system.getC().getNumRows(), 1));
  }

  update(dt: Measurement): void {}

  protected updateX(
    currentXHat: WpiMatrix<States, Nats<1>>,
    u: WpiMatrix<Inputs, Nats<1>>,
    dt: Measurement
  ): WpiMatrix<States, Nats<1>> {
    return this.plant.calculateX(currentXHat, u, dt);
  }
}

/*


        VecBuilder.fill(
            motor.kT.div(motor.kV.mul(motor.resistance).mul(moi)).scalar)
        ),
        VecBuilder.fill(motor.kT.div(motor.resistance.mul(moi)).scalar),
        new WpiMatrix(Matrix.eye(1)),
        new WpiMatrix(1, 1)

        */
