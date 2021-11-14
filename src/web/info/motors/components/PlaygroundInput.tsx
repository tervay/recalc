import { Column, Columns } from "common/components/styling/Building";
import { StateHook } from "common/models/ExtraTypes";
import MotorPlaygroundList from "common/models/MotorPlaygroundList";
import SingleMotorPlaygroundInput from "web/info/motors/components/SingleMotorPlaygroundInput";

export default function PlaygroundInput(props: {
  stateHook: StateHook<MotorPlaygroundList>;
}): JSX.Element {
  return (
    <>
      <Columns multiline>
        {props.stateHook[0].entries.map((e) => (
          <Column ofTwelve={3} key={e.motor.identifier}>
            <SingleMotorPlaygroundInput
              entry={e}
              parentHook={props.stateHook}
            />
          </Column>
        ))}
      </Columns>
    </>
  );
}
