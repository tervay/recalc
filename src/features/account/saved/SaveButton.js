import React, { useState } from "react";
import { IsSignedIn } from "../../auth/Auth";
import db from "../../db";
import { GetUser } from "../../auth/Auth";
import * as firebase from "firebase/app";

function save(user, query) {
  const userRef = db.collection("users").doc(user);
  userRef.update({
    configs: firebase.firestore.FieldValue.arrayUnion({
      name: "foo",
      query: query,
    }),
  });
}

function SaveModal(props) {
  let modalClasses = "modal";
  if (props.isActive) {
    modalClasses += " is-active";
  }
  const user = GetUser();

  return (
    <div className={modalClasses}>
      <div className="modal-background"></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Modal title</p>
          <button
            className="delete"
            aria-label="close"
            onClick={(e) => props.setActive(false)}
          />
        </header>
        <section className="modal-card-body">content</section>
        <footer className="modal-card-foot">
          <button
            className="button is-success"
            onClick={(e) => {
              save(user, props.query);
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

export default function SaveButton(props) {
  const [modalActive, setModalActive] = useState(false);

  if (!IsSignedIn()) {
    return <div></div>;
  }

  return (
    <div>
      <button
        className="button is-primary"
        onClick={(e) => setModalActive(true)}
      >
        Save This Config
      </button>
      <SaveModal
        isActive={modalActive}
        setActive={setModalActive}
        query={props.query}
      />
    </div>
  );
}
