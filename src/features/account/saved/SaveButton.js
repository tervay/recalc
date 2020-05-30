import React from "react";
import { IsSignedIn } from "../../auth/Auth";

function handleClick(inputs) {
  console.log(inputs);
}

export default function SaveButton(props) {
  if (!IsSignedIn()) {
    return <div></div>;
  }

  return (
    <div>
      <button
        className="button is-primary"
        onClick={(e) => {
          handleClick(props.getInputs());
        }}
      >
        Save This Config
      </button>
    </div>
  );
}
