import propTypes from "prop-types";
import React from "react";
import { useSelector } from "redux-zero/react";

export function SaveButton(props) {
  const isSignedIn = useSelector(({ isSignedIn }) => isSignedIn);
  const disabled = !isSignedIn;

  return (
    <>
      <button
        className="button is-primary has-text-white"
        disabled={disabled}
        onClick={props.onClick}
      >
        <span className="icon is-small">
          <i className="fas fa-save" />
        </span>
        <span>Save</span>
      </button>
    </>
  );
}

SaveButton.propTypes = {
  onClick: propTypes.func,
};
