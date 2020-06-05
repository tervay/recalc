import React from "react";
import { UnlabeledQtyInput } from "./QtyInput";

export default function TabularInput(props) {
  return (
    <div className="table-container">
      <table className="table is-narrow">
        <thead>
          {props.headers.map((h) => (
            <th>{h}</th>
          ))}
        </thead>
        <tbody>
          {props.inputs.map(([input, setInput], i) => {
            return (
              <tr>
                <td>{props.labels[i]}</td>
                {Object.keys(input).map((k) => (
                  <td>
                    <UnlabeledQtyInput
                      stateHook={[
                        input[k],
                        (v) => {
                          setInput({
                            ...input,
                            [k]: v,
                          });
                        },
                      ]}
                      choices={[input[k].units()]}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
