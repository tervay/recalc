import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import {
  BooleanInput,
  MeasurementInput,
} from "common/components/io/new/inputs";
import { Column, Columns, Panel } from "common/components/styling/Building";
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
  const [visibility, setVisibility] = useState(props.entry.visibilityOptions);
  const [enabled, setEnabled] = useState(props.entry.motor.quantity > 0);

  useEffect(() => {
    setParent(
      parent.replaceEntry(
        props.entry,
        new MotorPlaygroundEntry(
          Motor.fromIdentifier(props.entry.motor.identifier, enabled ? 1 : 0),
          currentLimit,
          voltage,
          props.entry.ratio,
          visibility
        )
      )
    );
  }, [currentLimit, voltage, visibility, enabled]);

  return (
    <>
      <Panel
        heading={
          <div>
            <a className="has-text-black" href={props.entry.motor.url}>
              {props.entry.motor.identifier}
            </a>
          </div>
        }
      >
        <SingleInputLine label="Current Limit" wrap>
          <MeasurementInput stateHook={[currentLimit, setCurrentLimit]} />
        </SingleInputLine>
        <SingleInputLine label="Voltage" wrap>
          <MeasurementInput
            dangerIf={() => voltage.gt(nominalVoltage)}
            stateHook={[voltage, setVoltage]}
          />
        </SingleInputLine>

        <Columns multiline>
          <Column>
            <SingleInputLine label="Enabled">
              <BooleanInput stateHook={[enabled, setEnabled]} />
            </SingleInputLine>
          </Column>
          <Column>
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
          </Column>
          <Column>
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
          </Column>
          <Column>
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
          </Column>
        </Columns>
      </Panel>
    </>
  );
}
