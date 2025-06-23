import {
  add,
  column,
  concat,
  floor,
  identity,
  lsolve,
  LUDecomposition,
  lup,
  lusolve,
  matrix,
  Matrix,
  multiply,
  norm,
  subtract,
  transpose,
  usolve,
} from "mathjs";
import { rationalMatrixPower } from "./rationalMatrixPower";

function luSolve(A: LUDecomposition, B: Matrix) {
  const cols = [];

  for (let i = 0; i < B.size()[0]; i++) {
    cols[i] = column(B, i);
  }

  return concat(...cols.map((col) => lusolve(A, col))) as Matrix;
}

/**
 * Solves the disc Algebraic Riccati Equation (DARE).
 *
 * @param {Matrix} A The state transition matrix.
 * @param {Matrix} B The control input matrix.
 * @param {Matrix} Q The state weighting matrix.
 * @param {Matrix} R The control weighting matrix.
 * @returns {Matrix} The solution to the DARE.
 */
export function dare(A: Matrix, B: Matrix, Q: Matrix, R: Matrix): Matrix {
  let A_k = A;
  let G_k = multiply(B, transpose(lusolve(R, B)));
  let H_k1 = Q;

  while (true) {
    const H_k: Matrix = H_k1;
    const W = identity(A.size()[0]) as Matrix;
    const W_added = add(W, multiply(G_k, H_k));
    const lu = lup(W_added);
    const V_1 = luSolve(lu, A_k);
    const V_2 = transpose(luSolve(lu, transpose(G_k)));
    G_k = add(G_k, multiply(A_k, V_2, transpose(A_k)));
    H_k1 = add(H_k, multiply(transpose(V_1), H_k, A_k));
    A_k = multiply(A_k, V_1);

    if (Number(norm(subtract(H_k1, H_k))) <= 1e-10 * Number(norm(H_k1))) {
      break;
    }
  }

  return H_k1;
}

/**
 * Approximates the latency compensation for the LQR gain (m_K).
 *
 * @param K - original gain matrix
 * @param A - continuous system matrix
 * @param B - continuous input matrix
 * @param dt - discretization timestep
 * @param inputDelay - input delay
 *
 * @returns compensated gain matrix
 */
export function latencyCompensatePosition(
  kP: number,
  kD: number,
  A: Matrix,
  B: Matrix,
  dt: number,
  inputDelay: number,
) {
  const K = matrix([[kP, kD]]);
  // m_K * (discA - discB * m_K).pow(inputDelay / dt);
  const K_comp = multiply(
    K,
    rationalMatrixPower(
      matrix(add(A, multiply(B, multiply(K, -1)))),
      floor(inputDelay / dt),
    ),
  );
  return {
    kp: K_comp.get([0, 0]),
    kd: K_comp.get([0, 1]),
  };
}

export function latencyCompensateVelocity(
  kP: number,
  A: Matrix,
  B: Matrix,
  dt: number,
  inputDelay: number,
) {
  const K = matrix([[kP]]);
  // m_K * (discA - discB * m_K).pow(inputDelay / dt);
  const K_comp = multiply(
    K,
    rationalMatrixPower(
      matrix(add(A, multiply(B, multiply(K, -1)))),
      floor(inputDelay / dt),
    ),
  );
  return {
    kp: K_comp.get([0, 0]),
  };
}

/**
 * Calculates the control gain matrix for a linear system using LQR.
 *
 * @param {Matrix} A The state transition matrix.
 * @param {Matrix} B The control input matrix.
 * @param {Matrix} Q The state weighting matrix.
 * @param {Matrix} R The control weighting matrix.
 * @param {number} dt The loop time.
 * @returns {Matrix} The control gain matrix.
 */
export function lqr(A: Matrix, B: Matrix, Q: Matrix, R: Matrix) {
  const P = dare(A, B, Q, R);

  // Solving these separately using `lsolve` and `usolve` results in better numerical accuracy than simultaneously w/ `lusolve` for reasons I do not understand
  if (Q.size && Q.size()[0] === 1 && Q.size()[1] === 1) {
    const kp = lsolve(
      add(multiply(transpose(B), P, B), R),
      transpose(multiply(transpose(B), P, A)),
    ).get([0, 0]);
    return { kp: kp, kd: 0 };
  } else {
    const kp = lsolve(
      add(multiply(transpose(B), P, B), R),
      transpose(multiply(transpose(B), P, A)),
    ).get([0, 0]);
    const kd = usolve(
      add(multiply(transpose(B), P, B), R),
      transpose(multiply(transpose(B), P, A)),
    ).get([1, 0]);
    return { kp, kd };
  }
}
