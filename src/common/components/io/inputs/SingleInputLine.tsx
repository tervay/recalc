import Tippy from "@tippyjs/react";
import React from "react";
import { animateFill } from "tippy.js";

export default function SingleInputLine(props: {
  children: JSX.Element;
  label: string;
  for?: "numeric" | "id";
  id?: string;
  wrap?: boolean;
  horizontal?: boolean;
  tooltip?: React.ReactNode;
}): JSX.Element {
  const classes = ["field"];
  if (props.horizontal === undefined || props.horizontal) {
    classes.push("is-horizontal");
  }

  if (props.wrap) {
    classes.push("is-flex-wrap-wrap");
  }

  const labelDiv =
    props.tooltip === undefined ? (
      <>{props.label}</>
    ) : (
      <Tippy
        content={props.tooltip}
        animateFill
        plugins={[animateFill]}
        allowHTML
      >
        <span className="underline-for-tooltip">{props.label}</span>
      </Tippy>
    );

  return (
    <div className={classes.join(" ")}>
      <div
        className={`field-label is-normal ${
          !(props.horizontal === undefined || props.horizontal)
            ? "has-text-left"
            : ""
        }`}
      >
        <label className="label" htmlFor={props.id}>
          {labelDiv}
        </label>
      </div>
      <div className="field-body">
        {React.cloneElement(props.children, {
          id: props.id,
          numberId: props.id,
          selectId: `select${props.id}`,
          expanded: true,
        })}
      </div>
    </div>
  );
}
