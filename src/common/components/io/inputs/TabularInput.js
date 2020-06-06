import React from "react";
import { UnlabeledQtyInput } from "./QtyInput";

export default function TabularInput(props) {
  return (
    <div className="table-container">
      <table className="table is-narrow center-table">
        <thead>
          <tr>
            {props.headers.map((h) => {
              if (h instanceof Array) {
                return (
                  <th key={h[0]}>
                    <abbr title={h[1]}>{h[0]}</abbr>
                  </th>
                );
              } else {
                return <th key={h}>{h}</th>;
              }
            })}
          </tr>
        </thead>
        <tbody>
          {props.inputs.map(([input, setInput], i) => {
            return (
              <tr key={`${i}`}>
                <td>{props.labels[i]}</td>
                {Object.keys(input).map((k, j) => {
                  if (k === "enabled") {
                    return (
                      <td key={`${i}_${k}_${props.labels[i]}`}>
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={input[k]}
                            onChange={(e) => {
                              setInput({
                                ...input,
                                [k]: !input[k],
                              });
                            }}
                          />
                        </label>
                      </td>
                    );
                  } else {
                    return (
                      <td key={`${i}_${k}_${props.labels[i]}`}>
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
                          choices={props.choices[j]}
                        />
                      </td>
                    );
                  }
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
