import Compressor, { compressorMap } from "common/models/Compressor";
import Measurement from "common/models/Measurement";
import each from "jest-each";

const allCompressorNames = [
  "VIAIR 90C (13.8v)",
  "VIAIR 90C (12v)",
  "VIAIR 250C-IG (13.8v)",
  "VIAIR 330C-IG (13.8v)",
  "Thomas 215 (12v)",
  "Thomas 405 (12v)",
  "AndyMark 1.1 Pump (12v)",
];

function makeSureFieldsAreCorrect(compressor, compressorName) {
  expect(compressor.name).toBe(compressorName);
  expect(compressor.weight.scalar).toBe(
    compressorMap[compressorName].weight.scalar
  );
  expect(compressor.cfmFn(new Measurement(0, "psi")).scalar).toBeLessThan(
    1.1001
  );
  expect(compressor.cfmFn(new Measurement(0, "psi")).scalar).toBeGreaterThan(0);
  expect(compressor.polynomialTerms.length).toBeGreaterThan(0);
  expect(compressor.url.length).toBeGreaterThan(0);
}

each(allCompressorNames).test(
  "Compressor constructor properly sets fields from compressor data",
  (compressorName) => {
    const compressor = new Compressor(compressorName);
    makeSureFieldsAreCorrect(compressor, compressorName);
  }
);

each(allCompressorNames).test(
  "compressor::toDict is the proper structure",
  (compressorName) => {
    const compressor = new Compressor(compressorName);

    expect(compressor.toDict()).toStrictEqual({ name: compressorName });
  }
);

each(allCompressorNames.map((n) => ({ name: n }))).test(
  "compressor::fromDict parses correctly",
  (compressorDict) => {
    const compressor = Compressor.fromDict(compressorDict);
    makeSureFieldsAreCorrect(compressor, compressorDict["name"]);
  }
);

test("Compressor::encode serializes correctly", () => {
  const encode = Compressor.getParam().encode;
  const serialized = encode(new Compressor("VIAIR 90C (12v)"));

  expect(serialized).toBe('{"name":"VIAIR 90C (12v)"}');
});
