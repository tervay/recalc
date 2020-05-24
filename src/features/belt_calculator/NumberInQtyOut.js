import React from "react";

export default function NumberInQtyOut(props) {
  return (
    <div class="field is-horizontal">
      <div class="field-label is-normal">
        <label class="label">{props.label}</label>
      </div>
      <div class="field-body">
        {props.input}
        {props.output}
      </div>
    </div>
  );
}
