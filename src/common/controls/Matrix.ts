import { Matrix } from "ml-matrix";

export type Nat<N extends number> = number;
export type Num = number;

export type Nats<T extends number> = T extends any
  ? T extends infer Digit extends number
    ? Digit
    : never
  : never;

type WpiMatrixConstructorArg<R extends Num, C extends Num> =
  | { rows: Nat<R>; cols: Nat<C> }
  | Matrix;

class WpiMatrix<R extends Num, C extends Num> {
  private storage: Matrix;

  constructor(arg: WpiMatrixConstructorArg<R, C>) {
    if (arg instanceof Matrix) {
      this.storage = arg;
    } else {
      this.storage = new Matrix(arg.rows, arg.cols);
    }
  }

  getStorage(): Matrix {
    return this.storage;
  }

  getNumCols(): number {
    return this.storage.columns;
  }

  getNumRows(): number {
    return this.storage.rows;
  }

  get(row: number, col: number): number {
    return this.storage.get(row, col);
  }

  set(row: number, col: number, value: number): void {
    this.storage.set(row, col, value);
  }

  setRow(row: number, val: WpiMatrix<Nats<1>, C>): void {
    this.storage.setRow(row, val.storage.getRow(0));
  }

  setColumn(column: number, val: WpiMatrix<R, Nats<1>>): void {
    this.storage.setColumn(column, val.storage.getColumn(0));
  }

  fill(value: number): void {
    this.storage.fill(value);
  }
}

export class MatBuilder<R extends Num, C extends Num> {
  protected rows: Nat<R>;
  protected cols: Nat<C>;

  constructor(rows: Nat<R>, cols: Nat<C>) {
    this.rows = rows;
    this.cols = cols;
  }

  fill(...data: number[]): WpiMatrix<R, C> {
    if (data.length !== this.rows * this.cols) {
      throw new Error(
        `Wanted ${this.rows} x ${this.cols} but got ${data.length} elements`
      );
    }

    let mat_elements: number[][] = [];
    return new WpiMatrix(new Matrix(mat_elements));
  }
}

type WpiVectorConstructorArg<R extends Num> = { rows: Nat<R> } | Matrix;

export class WpiVector<R extends Num> extends WpiMatrix<R, Nats<1>> {
  constructor(arg: WpiVectorConstructorArg<R>) {
    if (arg instanceof Matrix) {
      super(arg);
    } else {
      super({ rows: arg.rows, cols: 1 });
    }
  }
}

export class VecBuilder<N extends Num> extends MatBuilder<N, Nats<1>> {
  constructor(rows: Nats<N>) {
    super(rows, 1);
  }

  private fillVec(...data: number[]): WpiVector<N> {
    return new WpiVector(super.fill(...data).getStorage());
  }

  static fill(n1: number): WpiVector<Nats<1>> {
    return new VecBuilder(1).fillVec(n1);
  }
}

export default WpiMatrix;
