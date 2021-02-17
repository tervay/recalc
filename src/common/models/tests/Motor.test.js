import Motor, { MotorState } from "common/models/Motor";
import Measurement from "common/models/Measurement";

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
        freeSpeed: new Measurement(5676, "rpm"),
        stallTorque: new Measurement(2.6, "N*m"),
        stallCurrent: new Measurement(105, "A"),
        freeCurrent: new Measurement(1.8, "A"),
        weight: new Measurement(0.94, "lb"),
        url: "https://www.revrobotics.com/rev-21-1650/",
        kV: new Measurement(5676 / 12, "rpm/V"),
        kT: new Measurement(2.6 / (105 - 1.8), "N*m/A"),
        maxPower: new Measurement((5676 / 2) * (2.6 / 2), "rpm * N * m"),
        resistance: new Measurement(12 / 105, "V / A"),
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
        freeSpeed: new Measurement(11000, "rpm"),
        stallTorque: new Measurement(0.97, "N*m"),
        stallCurrent: new Measurement(100, "A"),
        freeCurrent: new Measurement(1.4, "A"),
        weight: new Measurement(0.31, "lb"),
        url: "https://www.revrobotics.com/rev-21-1651/",
        kV: new Measurement(11000 / 12, "rpm/V"),
        kT: new Measurement(0.97 / (100 - 1.4), "N*m/A"),
        maxPower: new Measurement((11000 / 2) * (0.97 / 2), "rpm * N * m"),
        resistance: new Measurement(12 / 100, "V / A"),
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
        freeSpeed: new Measurement(16000, "rpm"),
        stallTorque: new Measurement(0.428, "N*m"),
        stallCurrent: new Measurement(63.8, "A"),
        freeCurrent: new Measurement(1.2, "A"),
        weight: new Measurement(0.5, "lb"),
        url: "https://www.andymark.com/products/9015-motor",
        kV: new Measurement(16000 / 12, "rpm/V"),
        kT: new Measurement(0.428 / (63.8 - 1.2), "N*m/A"),
        maxPower: new Measurement((16000 / 2) * (0.428 / 2), "rpm * N * m"),
        resistance: new Measurement(12 / 63.8, "V / A"),
      },
    ],
    [
      Motor.NeveRests(1),
      {
        name: "NeveRest",
        freeSpeed: new Measurement(6600, "rpm"),
        stallTorque: new Measurement(0.06178858, "N*m"),
        stallCurrent: new Measurement(11.5, "A"),
        freeCurrent: new Measurement(0.4, "A"),
        weight: new Measurement(0.587, "lb"),
        url: "https://www.andymark.com/products/neverest-series-motor-only",
        kV: new Measurement(6600 / 12, "rpm/V"),
        kT: new Measurement(0.06178858 / (11.5 - 0.4), "N*m/A"),
        maxPower: new Measurement((6600 / 2) * (0.06178858 / 2), "rpm * N * m"),
        resistance: new Measurement(12 / 11.5, "V / A"),
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
        url:
          "https://www.andymark.com/products/snow-blower-motor-with-hex-shaft",
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
        freeSpeed: new Measurement(21020, "rpm"),
        stallTorque: new Measurement(0.7, "N*m"),
        stallCurrent: new Measurement(130, "A"),
        freeCurrent: new Measurement(3.8, "A"),
        weight: new Measurement(0.806, "lb"),
        url: "https://www.andymark.com/products/andymark-775-redline-motor-v2",
        kV: new Measurement(21020 / 12, "rpm/V"),
        kT: new Measurement(0.7 / (130 - 3.8), "N*m/A"),
        maxPower: new Measurement((21020 / 2) * (0.7 / 2), "rpm * N * m"),
        resistance: new Measurement(12 / 130, "V / A"),
      },
    ],
  ])("(%#) Fields are properly set from motorMap", (motor, data) => {
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
      maxPower: expect.toEqualMeasurement(data.maxPower.removeRad()),
      resistance: expect.toEqualMeasurement(data.resistance),
    });
  });
});


describe("Motor state solver tests", () => {
    test.each([])("(%#) Basic state solves terminate with correct answer", () => {
        
    })
});
