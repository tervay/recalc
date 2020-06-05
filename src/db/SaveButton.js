import React, { useState } from "react";
import { useSelector } from "redux-zero/react";
import db from "db";
import { SaveModal } from "./SaveModal";

export function SaveButton(props) {
  const isSignedIn = useSelector(({ isSignedIn, id }) => isSignedIn);
  const disabled = !isSignedIn;

  return (
    <>
      <button
        class="button is-primary"
        disabled={disabled}
        onClick={props.onClick}
      >
        <span class="icon is-small">
          <i class="fas fa-save"></i>
        </span>
        <span>Save</span>
      </button>
    </>
  );
}
