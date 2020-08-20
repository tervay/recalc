import { save } from "db";
import propTypes from "prop-types";
import React, { useState } from "react";

export function SaveModal(props) {
  let modalClasses = "modal";
  if (props.isActive) {
    modalClasses += " is-active";
  }
  const [configName, setConfigName] = useState("");

  return (
    <div className={modalClasses}>
      <div className="modal-background" />
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Modal title</p>
          <button
            className="delete"
            aria-label="close"
            onClick={() => props.setActive(false)}
          />
        </header>
        <section className="modal-card-body">
          <div className="field">
            <label className="label">Config name</label>
            <div className="control">
              <input
                className="input"
                type="text"
                placeholder="e.g. 2020 Elevator"
                value={configName}
                onChange={(e) => {
                  setConfigName(e.target.value);
                }}
              />
            </div>
          </div>
        </section>
        <footer className="modal-card-foot">
          <button
            className="button is-success"
            onClick={() => {
              save(props.user, configName, props.url, props.query);
              props.setActive(false);
            }}
          >
            Save changes
          </button>
        </footer>
      </div>
    </div>
  );
}

SaveModal.propTypes = {
  user: propTypes.string,
  url: propTypes.string,
  query: propTypes.string,
  setActive: propTypes.func,
  isActive: propTypes.bool,
};
