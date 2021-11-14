import { A, deg, inch, lb, Nm, rpm, s, V, W } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio, { RatioType } from "common/models/Ratio";
import {
  calculateArmStates,
  calculateMaximumStringArmMountingDistance,
  calculateSpringConstant,
  MomentaryArmState,
} from "web/calculators/arm/armMath";

describe("armMath", () => {
  test.skip.each([
    {
      comLength: inch(1),
      armMass: inch(1),
      stringPulleyMountHeight: inch(1),
      stringArmMountDistance: inch(1),
      expected: inch(1),
    },
    {
      comLength: inch(1),
      armMass: inch(1),
      stringPulleyMountHeight: inch(1),
      stringArmMountDistance: inch(1),
      expected: inch(1),
    },
    {
      comLength: inch(1),
      armMass: inch(1),
      stringPulleyMountHeight: inch(1),
      stringArmMountDistance: inch(1),
      expected: inch(1),
    },
  ])(
    "%p calculateSpringConstant",
    ({
      comLength,
      armMass,
      stringPulleyMountHeight,
      stringArmMountDistance,
      expected,
    }) => {
      expect(
        calculateSpringConstant(
          comLength,
          armMass,
          stringPulleyMountHeight,
          stringArmMountDistance
        )
      ).toBeCloseToMeasurement(expected);
    }
  );
  test.skip.each([
    { springLength: inch(1), elongationAllowed: 100, expected: inch(1) },
    { springLength: inch(1), elongationAllowed: 100, expected: inch(1) },
    { springLength: inch(1), elongationAllowed: 100, expected: inch(1) },
  ])(
    "%p calculateMaximumStringArmMountingDistance",
    ({ springLength, elongationAllowed, expected }) => {
      expect(
        calculateMaximumStringArmMountingDistance(
          springLength,
          elongationAllowed
        )
      ).toBeCloseToMeasurement(expected);
    }
  );
  test.only.each([
    {
      motor_: Motor.CIMs(3).toDict(),
      ratio_: new Ratio(100, RatioType.REDUCTION).toDict(),
      comLength_: inch(20).toDict(),
      armMass_: lb(15).toDict(),
      currentLimit_: A(135).toDict(),
      startAngle_: Measurement.CIRCLE_RIGHT().toDict(),
      endAngle_: Measurement.CIRCLE_UP().toDict(),
      iterationLimit: 1000,
      expected: {
        motorState: {
          current: A(3.1698).toDict(),
          power: W(4.8065).toDict(),
          rpm: rpm(5310.4826).toDict(),
          torque: Nm(0.0086).toDict(),
          voltage: V(12).toDict(),
        },
        position: deg(90.148).toDict(),
        time: s(0.304).toDict(),
      } as MomentaryArmState,
    },
    {
      motor_: Motor.CIMs(3).toDict(),
      ratio_: new Ratio(100, RatioType.REDUCTION).toDict(),
      comLength_: inch(20).toDict(),
      armMass_: lb(15).toDict(),
      currentLimit_: A(40).toDict(),
      startAngle_: Measurement.CIRCLE_RIGHT().toDict(),
      endAngle_: Measurement.CIRCLE_UP().toDict(),
      iterationLimit: 1000,
      expected: {
        motorState: {
          current: A(3.178).toDict(),
          power: W(4.89).toDict(),
          rpm: rpm(5310.143).toDict(),
          torque: Nm(0.0086).toDict(),
          voltage: V(12).toDict(),
        },
        position: deg(90.071).toDict(),
        time: s(0.3195).toDict(),
      } as MomentaryArmState,
    },
    {
      motor_: Motor._775pros(2).toDict(),
      ratio_: new Ratio(125, RatioType.REDUCTION).toDict(),
      comLength_: inch(10).toDict(),
      armMass_: lb(40).toDict(),
      currentLimit_: A(135).toDict(),
      startAngle_: Measurement.CIRCLE_RIGHT().toDict(),
      endAngle_: Measurement.CIRCLE_UP().toDict(),
      iterationLimit: 1000,
      expected: {
        motorState: {
          current: A(34.223).toDict(),
          power: W(260.7737).toDict(),
          rpm: rpm(14019.6667).toDict(),
          torque: Nm(0.1776).toDict(),
          voltage: V(12).toDict(),
        },
        position: deg(90.029).toDict(),
        time: s(0.2195).toDict(),
      } as MomentaryArmState,
    },
  ])(
    "%p calculateArmStates",
    ({
      motor_,
      ratio_,
      comLength_,
      armMass_,
      currentLimit_,
      startAngle_,
      endAngle_,
      iterationLimit,
      expected,
    }) => {
      const armStates = calculateArmStates(
        motor_,
        ratio_,
        comLength_,
        armMass_,
        currentLimit_,
        startAngle_,
        endAngle_,
        iterationLimit
      );
      expect(armStates.length).toBeGreaterThan(0);
      expect(armStates.length).toBeLessThanOrEqual(iterationLimit);
      const lastArmState = armStates[armStates.length - 1];
      expect(
        Measurement.fromDict(lastArmState.motorState.current)
      ).toBeCloseToMeasurement(
        Measurement.fromDict(expected.motorState.current)
      );
      expect(
        Measurement.fromDict(lastArmState.motorState.power)
      ).toBeCloseToMeasurement(Measurement.fromDict(expected.motorState.power));
      expect(
        Measurement.fromDict(lastArmState.motorState.rpm)
      ).toBeCloseToMeasurement(Measurement.fromDict(expected.motorState.rpm));
      expect(
        Measurement.fromDict(lastArmState.motorState.torque)
      ).toBeCloseToMeasurement(
        Measurement.fromDict(expected.motorState.torque)
      );
      expect(
        Measurement.fromDict(lastArmState.motorState.voltage)
      ).toBeCloseToMeasurement(
        Measurement.fromDict(expected.motorState.voltage)
      );
      expect(
        Measurement.fromDict(lastArmState.position)
      ).toBeCloseToMeasurement(Measurement.fromDict(expected.position));
      expect(Measurement.fromDict(lastArmState.time)).toBeCloseToMeasurement(
        Measurement.fromDict(expected.time)
      );
    }
  );
});
