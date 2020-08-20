import each from "jest-each";

import { teethToPD } from "../math";

each([
  [32, "#25", 2.551],
  [40, "#25", 3.186],
  [66, "#25", 5.254],
  [22, "#35", 2.635],
  [33, "#35", 3.945],
  [54, "#35", 6.449],
]).test("chain teeth -> pitch diameter", (teeth, chain, expected) => {
  expect(teethToPD(teeth, chain).to("in").scalar).toBeCloseTo(expected, 3);
});
