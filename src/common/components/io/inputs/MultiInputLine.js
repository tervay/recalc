import React from "react";

export default function MultiInputLine(props) {
  return (
    <div class="field is-horizontal">
      <div class="field-label is-normal">
        <label class="label">{props.label}</label>
      </div>
      <div class="field-body">
        <div className="columns">
          {props.children.map((c) => {
            return <div className="column">{c}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
