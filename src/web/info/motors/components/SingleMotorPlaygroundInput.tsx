import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import {
  BooleanInput,
  MeasurementInput,
  NumberInput,
} from "common/components/io/new/inputs";
import { Panel } from "common/components/styling/Building";
import { StateHook } from "common/models/ExtraTypes";
import Motor, { nominalVoltage } from "common/models/Motor";
import MotorPlaygroundList, {
  MotorPlaygroundEntry,
} from "common/models/MotorPlaygroundList";
import { useEffect, useState } from "react";

export default function SingleMotorPlaygroundInput(props: {
  entry: MotorPlaygroundEntry;
  parentHook: StateHook<MotorPlaygroundList>;
}): JSX.Element {
  const [parent, setParent] = props.parentHook;
  const [currentLimit, setCurrentLimit] = useState(props.entry.currentLimit);
  const [voltage, setVoltage] = useState(props.entry.voltage);
  const [quantity, setQuantity] = useState(props.entry.motor.quantity);
  const [visibility, setVisibility] = useState(props.entry.visibilityOptions);

  useEffect(() => {
    setParent(
      parent.replaceEntry(
        props.entry,
        new MotorPlaygroundEntry(
          Motor.fromIdentifier(props.entry.motor.identifier, quantity),
          currentLimit,
          voltage,
          props.entry.ratio,
          visibility
        )
      )
    );
  }, [currentLimit, voltage, quantity, visibility]);

  return (
    <>
      <Panel heading={<div>{props.entry.motor.identifier}</div>}>
        <SingleInputLine label="Current Limit" wrap>
          <MeasurementInput stateHook={[currentLimit, setCurrentLimit]} />
        </SingleInputLine>
        <SingleInputLine label="Voltage" wrap>
          <MeasurementInput
            dangerIf={() => voltage.gt(nominalVoltage)}
            stateHook={[voltage, setVoltage]}
          />
        </SingleInputLine>
        <SingleInputLine label="Quantity" wrap>
          <NumberInput stateHook={[quantity, setQuantity]} />
        </SingleInputLine>
        <SingleInputLine label="Power">
          <BooleanInput
            stateHook={[
              visibility.showPower,
              (b) => {
                setVisibility({
                  ...visibility,
                  showPower: b.valueOf() as boolean,
                });
              },
            ]}
          />
        </SingleInputLine>
        <SingleInputLine label="Torque">
          <BooleanInput
            stateHook={[
              visibility.showTorque,
              (b) => {
                setVisibility({
                  ...visibility,
                  showTorque: b.valueOf() as boolean,
                });
              },
            ]}
          />
        </SingleInputLine>
        <SingleInputLine label="Current">
          <BooleanInput
            stateHook={[
              visibility.showCurrent,
              (b) => {
                setVisibility({
                  ...visibility,
                  showCurrent: b.valueOf() as boolean,
                });
              },
            ]}
          />
        </SingleInputLine>
      </Panel>
    </>
  );
}
