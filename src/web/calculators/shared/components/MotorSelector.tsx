import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import {
  MeasurementInput,
  MotorInput,
  NumberInput,
  RatioInput,
} from "common/components/io/new/inputs";
import { BaseState, Setters } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";

export interface MotorSelectorFields extends BaseState {
  motor: Motor;
  efficiency: number;
  ratio: Ratio;
  currentLimit: Measurement;
}

export interface MotorSelectorProps {
  get: MotorSelectorFields;
  set: Setters<MotorSelectorFields>;
}

export default function MotorSelector({
  get,
  set,
}: MotorSelectorProps): JSX.Element {
  return (
    <>
      <SingleInputLine
        label="Motor"
        id="motor"
        tooltip="Motors powering the arm."
      >
        <MotorInput stateHook={[get.motor, set.setMotor]} />
      </SingleInputLine>
      <SingleInputLine
        label="Efficiency (%)"
        id="efficiency"
        tooltip="The efficiency of the system in transmitting torque from the motors."
      >
        <NumberInput stateHook={[get.efficiency, set.setEfficiency]} />
      </SingleInputLine>
      <SingleInputLine
        label="Ratio"
        id="ratio"
        tooltip="Ratio of the gearbox attached to the motor."
      >
        <RatioInput stateHook={[get.ratio, set.setRatio]} />
      </SingleInputLine>
      <SingleInputLine
        label="Current Limit"
        id="currentLimit"
        tooltip="Current limit applied to each motor."
      >
        <MeasurementInput stateHook={[get.currentLimit, set.setCurrentLimit]} />
      </SingleInputLine>
    </>
  );
}
