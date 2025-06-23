import {
  Complex,
  Matrix,
  complex,
  concat,
  diag,
  eigs,
  inv,
  matrix,
  multiply,
  pow,
  reshape,
  round,
} from "mathjs";

/**
 * Calculates the power of a matrix with a rational exponent.
 *
 * @param {Matrix} matrix The input matrix.
 * @param {number} exponent The rational exponent.
 * @returns {Matrix} The resulting matrix.
 */
export function rationalMatrixPower(m: Matrix, exponent: number): Matrix {
  const { values: eigenvalues, eigenvectors: rawEigenvectors } = eigs(m);

  const poweredEigenvalues = eigenvalues.map((eigenvalue) => {
    const complexEigenvalue = complex(eigenvalue);
    return pow(complexEigenvalue, exponent);
  });

  const eigenvectors = rawEigenvectors.map((e) =>
    reshape(e.vector, [...matrix(e.vector).size(), 1]),
  );
  const eigenvectorMatrix = concat(...eigenvectors) as Matrix;
  const invEigenvectorMatrix = inv(eigenvectorMatrix);
  const diagonalMatrix = diag(
    poweredEigenvalues.map((x) => (x as Complex).re),
  ) as Matrix;

  let result = multiply(
    eigenvectorMatrix,
    diagonalMatrix,
    invEigenvectorMatrix,
  ) as Matrix;

  // Round to remove near-zero imaginary parts and small floating point errors
  result = round(result, 10) as Matrix;

  return result;
}
