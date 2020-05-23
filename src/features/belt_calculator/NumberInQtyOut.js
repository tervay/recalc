import React from "react";
import { QtyOutput } from "../common/QtyFields";
import { NumberInput } from "../common/NumberFields";

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
