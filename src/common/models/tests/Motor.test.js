import Measurement from "common/models/Measurement";
import Motor, { MotorState } from "common/models/Motor";

describe("Motor tests", () => {
  test("getAllMotors returns all Motor instances", () => {
    const allMotors = Motor.getAllMotors();

    expect(allMotors).toHaveLength(11);
    allMotors.forEach((m) => {
      expect(m).toBeInstanceOf(Motor);
    });
  });

  test.each([
    [
      Motor.Falcon500s(1),
      {
        name: "Falcon 500",
        freeSpeed: new Measurement(6380, "rpm"),
        stallTorque: new Measurement(4.69, "N*m"),
        stallCurrent: new Measurement(257, "A"),
        freeCurrent: new Measurement(1.5, "A"),
        weight: new Measurement(1.1, "lb"),
        url: "https://www.vexrobotics.com/217-6515.html",
        kV: new Measurement(6380 / 12, "rpm/V"),
        kT: new Measurement(4.69 / (257 - 1.5), "N*m/A"),
        maxPower: new Measurement((6380 / 2) * (4.69 / 2), "rpm * N * m"),
        resistance: new Measurement(12 / 257, "V / A"),
      },
    ],
    [
      Motor.NEOs(1),
      {
        name: "NEO",
        freeSpeed: new Measurement(5880, "rpm"),
        stallTorque: new Measurement(3.36, "N*m"),
        stallCurrent: new Measurement(166, "A"),
        freeCurrent: new Measurement(1.3, "A"),
        weight: new Measurement(0.94, "lb"),
        url: "https://www.revrobotics.com/rev-21-1650/",
        kV: new Measurement(5880 / 12, "rpm/V"),
        kT: new Measurement(3.36 / (166 - 1.3), "N*m/A"),
        maxPower: new Measurement((5880 / 2) * (3.36 / 2), "rpm * N * m"),
        resistance: new Measurement(12 / 166, "V / A"),
      },
    ],
    [
      Motor._775pros(1),
      {
        name: "775pro",
        freeSpeed: new Measurement(18730, "rpm"),
        stallTorque: new Measurement(0.71, "N*m"),
        stallCurrent: new Measurement(134, "A"),
        freeCurrent: new Measurement(0.7, "A"),
        weight: new Measurement(0.8, "lb"),
        url: "https://www.vexrobotics.com/775pro.html",
        kV: new Measurement(18730 / 12, "rpm/V"),
        kT: new Measurement(0.71 / (134 - 0.7), "N*m/A"),
        maxPower: new Measurement((18730 / 2) * (0.71 / 2), "rpm * N * m"),
        resistance: new Measurement(12 / 134, "V / A"),
      },
    ],
    [
      Motor.NEO550s(1),
      {
        name: "NEO 550",
        freeSpeed: new Measurement(11710, "rpm"),
        stallTorque: new Measurement(1.08, "N*m"),
        stallCurrent: new Measurement(111, "A"),
        freeCurrent: new Measurement(1.1, "A"),
        weight: new Measurement(0.31, "lb"),
        url: "https://www.revrobotics.com/rev-21-1651/",
        kV: new Measurement(11710 / 12, "rpm/V"),
        kT: new Measurement(1.08 / (111 - 1.1), "N*m/A"),
        maxPower: new Measurement((11710 / 2) * (1.08 / 2), "rpm * N * m"),
        resistance: new Measurement(12 / 111, "V / A"),
      },
    ],
    [
      Motor.CIMs(1),
      {
        name: "CIM",
        freeSpeed: new Measurement(5330, "rpm"),
        stallTorque: new Measurement(2.41, "N*m"),
        stallCurrent: new Measurement(131, "A"),
        freeCurrent: new Measurement(2.7, "A"),
        weight: new Measurement(2.82, "lb"),
        url: "https://www.vexrobotics.com/217-2000.html",
        kV: new Measurement(5330 / 12, "rpm/V"),
        kT: new Measurement(2.41 / (131 - 2.7), "N*m/A"),
        maxPower: new Measurement((5330 / 2) * (2.41 / 2), "rpm * N * m"),
        resistance: new Measurement(12 / 131, "V / A"),
      },
    ],
    [
      Motor.MiniCIMs(1),
      {
        name: "MiniCIM",
        freeSpeed: new Measurement(5840, "rpm"),
        stallTorque: new Measurement(1.41, "N*m"),
        stallCurrent: new Measurement(89, "A"),
        freeCurrent: new Measurement(3, "A"),
        weight: new Measurement(2.16, "lb"),
        url: "https://www.vexrobotics.com/217-3371.html",
        kV: new Measurement(5840 / 12, "rpm/V"),
        kT: new Measurement(1.41 / (89 - 3), "N*m/A"),
        maxPower: new Measurement((5840 / 2) * (1.41 / 2), "rpm * N * m"),
        resistance: new Measurement(12 / 89, "V / A"),
      },
    ],
    [
      Motor.BAGs(1),
      {
        name: "BAG",
        freeSpeed: new Measurement(13180, "rpm"),
        stallTorque: new Measurement(0.43, "N*m"),
        stallCurrent: new Measurement(53, "A"),
        freeCurrent: new Measurement(1.8, "A"),
        weight: new Measurement(0.71, "lb"),
        url: "https://www.vexrobotics.com/217-3351.html",
        kV: new Measurement(13180 / 12, "rpm/V"),
        kT: new Measurement(0.43 / (53 - 1.8), "N*m/A"),
        maxPower: new Measurement((13180 / 2) * (0.43 / 2), "rpm * N * m"),
        resistance: new Measurement(12 / 53, "V / A"),
      },
    ],
    [
      Motor.AM9015s(1),
      {
        name: "AM-9015",
        freeSpeed: new Measurement(14270, "rpm"),
        stallTorque: new Measurement(0.36, "N*m"),
        stallCurrent: new Measurement(71, "A"),
        freeCurrent: new Measurement(3.7, "A"),
        weight: new Measurement(0.5, "lb"),
        url: "https://www.andymark.com/products/9015-motor",
        kV: new Measurement(14270 / 12, "rpm/V"),
        kT: new Measurement(0.36 / (71 - 3.7), "N*m/A"),
        maxPower: new Measurement((14270 / 2) * (0.36 / 2), "rpm * N * m"),
        resistance: new Measurement(12 / 71, "V / A"),
      },
    ],
    [
      Motor.NeveRests(1),
      {
        name: "NeveRest",
        freeSpeed: new Measurement(5480, "rpm"),
        stallTorque: new Measurement(0.173, "N*m"),
        stallCurrent: new Measurement(9.8, "A"),
        freeCurrent: new Measurement(0.355, "A"),
        weight: new Measurement(0.587, "lb"),
        url: "https://www.andymark.com/products/neverest-series-motor-only",
        kV: new Measurement(5480 / 12, "rpm/V"),
        kT: new Measurement(0.173 / (9.8 - 0.355), "N*m/A"),
        maxPower: new Measurement((5480 / 2) * (0.173 / 2), "rpm * N * m"),
        resistance: new Measurement(12 / 9.8, "V / A"),
      },
    ],
    [
      Motor.Snowblowers(1),
      {
        name: "Snowblower",
        freeSpeed: new Measurement(100, "rpm"),
        stallTorque: new Measurement(7.90893775, "N*m"),
        stallCurrent: new Measurement(24, "A"),
        freeCurrent: new Measurement(5, "A"),
        weight: new Measurement(1.1, "lb"),
        url: "https://www.andymark.com/products/snow-blower-motor-with-hex-shaft",
        kV: new Measurement(100 / 12, "rpm/V"),
        kT: new Measurement(7.90893775 / (24 - 5), "N*m/A"),
        maxPower: new Measurement((100 / 2) * (7.90893775 / 2), "rpm * N * m"),
        resistance: new Measurement(12 / 24, "V / A"),
      },
    ],
    [
      Motor._775RedLines(1),
      {
        name: "775 RedLine",
        freeSpeed: new Measurement(19500, "rpm"),
        stallTorque: new Measurement(0.64, "N*m"),
        stallCurrent: new Measurement(122, "A"),
        freeCurrent: new Measurement(2.6, "A"),
        weight: new Measurement(0.806, "lb"),
        url: "https://www.andymark.com/products/andymark-775-redline-motor-v2",
        kV: new Measurement(19500 / 12, "rpm/V"),
        kT: new Measurement(0.64 / (122 - 2.6), "N*m/A"),
        maxPower: new Measurement((19500 / 2) * (0.64 / 2), "rpm * N * m"),
        resistance: new Measurement(12 / 122, "V / A"),
      },
    ],
  ])("%p Fields are properly set from motorMap", (motor, data) => {
    expect(motor).toMatchObject({
      url: data.url,
      name: data.name,
      freeSpeed: expect.toEqualMeasurement(data.freeSpeed),
      stallTorque: expect.toEqualMeasurement(data.stallTorque),
      stallCurrent: expect.toEqualMeasurement(data.stallCurrent),
      freeCurrent: expect.toEqualMeasurement(data.freeCurrent),
      weight: expect.toEqualMeasurement(data.weight),
      quantity: 1,
      kV: expect.toEqualMeasurement(data.kV),
      kT: expect.toEqualMeasurement(data.kT),
      maxPower: expect.toBeCloseToMeasurement(data.maxPower.removeRad()),
      resistance: expect.toEqualMeasurement(data.resistance),
    });
  });
});

const isSetsEqual = (a, b) =>
  a.size === b.size && [...a].every((value) => b.has(value));

const factorial = (n) => (!(n > 1) ? 1 : factorial(n - 1) * n);

function GenerateObjectKeyCombinations(obj, n) {
  function k_combinations(set, k) {
    var i, j, combs, head, tailcombs;
    if (k > set.length || k <= 0) {
      return [];
    }
    if (k == set.length) {
      return [set];
    }
    if (k == 1) {
      combs = [];
      for (i = 0; i < set.length; i++) {
        combs.push([set[i]]);
      }
      return combs;
    }
    combs = [];
    for (i = 0; i < set.length - k + 1; i++) {
      head = set.slice(i, i + 1);
      tailcombs = k_combinations(set.slice(i + 1), k - 1);
      for (j = 0; j < tailcombs.length; j++) {
        combs.push(head.concat(tailcombs[j]));
      }
    }
    return combs;
  }

  const props = Object.keys(obj);
  const combos = k_combinations(props, n);
  let ret = [];
  let seen = [];

  combos.forEach((c) => {
    const set = new Set(c);
    if (
      set.size < c.length ||
      seen.some((s) => {
        return isSetsEqual(new Set(s), set);
      })
    ) {
      return;
    }

    ret.push(c);
    seen.push(c);
  });

  return ret.map((c) => {
    let newObj = {};
    c.forEach((prop) => {
      newObj[prop] = obj[prop];
    });
    return newObj;
  });
}

test.each([
  [{ a: 1, b: 2, c: 3, d: 4 }, 1],
  [{ a: 1, b: 2, c: 3, d: 4 }, 2],
  [{ a: 1, b: 2, c: 3, d: 4 }, 3],
  [{ a: 1, b: 2, c: 3, d: 4 }, 4],
  [{ a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 }, 1],
  [{ a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 }, 2],
  [{ a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 }, 3],
  [{ a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 }, 4],
  [{ a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 }, 5],
  [{ a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 }, 6],
])("%p Generate combinations works properly", (obj, n) => {
  const combos = GenerateObjectKeyCombinations(obj, n);
  const props = Object.keys(obj).length;
  expect(combos).toHaveLength(
    factorial(props) / (factorial(n) * factorial(props - n))
  );
});

const motor = {
  voltage: new Measurement(12, "V"),
  rpm: new Measurement(6380 / 2, "rpm"),
  current: new Measurement((257 - 1.5) / 2, "A"),
  torque: new Measurement(4.69 / 2, "N * m"),
  power: new Measurement(783, "W"),
};

const combos = GenerateObjectKeyCombinations(motor, 3);

describe.each(combos)("%p MotorState combinations", (incompleteState) => {
  test("Terminates and completes state with high current limit", () => {
    const ms = new MotorState(
      Motor.Falcon500s(1),
      new Measurement(500, "A"),
      incompleteState
    ).solve();

    expect(ms.solved).toBeTruthy();
    expect(ms).toMatchObject({
      voltage: expect.toBeCloseToMeasurement(motor.voltage, 1),
      rpm: expect.toBeCloseToMeasurement(motor.rpm, -2),
      current: expect.toBeCloseToMeasurement(motor.current, -1),
      torque: expect.toBeCloseToMeasurement(motor.torque, 1),
      power: expect.toBeCloseToMeasurement(motor.power, -2),
    });
  });

  test("Terminates and completes state with moderate current limit", () => {
    const currentLimit = new Measurement(40, "A");
    const ms = new MotorState(
      Motor.Falcon500s(1),
      currentLimit,
      incompleteState
    ).solve();

    expect(ms.solved).toBeTruthy();
    expect(ms.didLimitCurrent).toBeTruthy();

    expect(ms.voltage).toBeGreaterThanMeasurement(new Measurement(0, "V"));
    expect(ms.voltage).toBeLessThanOrEqualMeasurement(new Measurement(12, "V"));
    expect(ms.current).toBeGreaterThanMeasurement(new Measurement(0, "A"));
    expect(ms.current).toBeLessThanOrEqualMeasurement(currentLimit);
  });
});
