import {
  Matrix,
  concat,
  dotMultiply,
  expm,
  index,
  matrix,
  range,
  subset,
  zeros,
} from "mathjs";

/**
 * Discretizes the given continuous A matrix.
 *
 * @param A - continuous system matrix
 * @param dt - discretization timestep
 *
 * @returns discrete system matrix
 */
export function discretize_a(A: Matrix, dt: number): Matrix {
  // ϕ = eᴬᵀ
  return expm(matrix(dotMultiply(A, dt))) as Matrix;
}

/**
 * Discretizes the given continuous A and B matrices.
 *
 * @param A - continuous system matrix
 * @param B - continuous input matrix
 * @param dt - discretization timestep
 *
 * @returns discrete system matrix, discrete input matrix
 */
export function discretize_ab(
  A: Matrix,
  B: Matrix,
  dt: number,
): [Matrix, Matrix] {
  const states = A.size()[0];
  const inputs = B.size()[1];

  // M = [A  B]
  //     [0  0]
  const M = expm(
    matrix(
      dotMultiply(
        concat(
          concat(A, B),
          concat(zeros(inputs, states), zeros(inputs, inputs)),
          0,
        ),
        dt,
      ),
    ),
  ) as Matrix;

  // ϕ = eᴹᵀ = [A_d  B_d]
  //           [ 0    I ]
  return [
    subset(M, index(range(0, states), range(0, states))),
    subset(M, index(range(0, states), range(states, states + inputs))),
  ];
}
