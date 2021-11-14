import L2NumberSelect from "common/components/io/new/inputs/L2/L2NumberSelect";
import { MotorInputProps } from "common/components/io/new/inputs/types/Types";
import Motor from "common/models/Motor";

export default function MotorInput(props: MotorInputProps): JSX.Element {
  const [motor, _] = props.stateHook;

  return (
    <L2NumberSelect
      {...props}
      choices={Motor.getAllChoices()}
      fromNumber={(n) => Motor.fromIdentifier(motor.identifier, n)}
      makeNumber={(m) => m.quantity}
      fromString={(s) => Motor.fromIdentifier(s, motor.quantity)}
      makeString={(m) => m.identifier}
      dangerIf={() => motor.quantity === 0}
    />
  );
}
