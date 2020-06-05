import ShareButton from "common/components/calc-heading/ShareButton";
import React, { useState } from "react";
import { useSelector } from "redux-zero/react";
import { SaveButton } from "db/SaveButton";
import { SaveModal } from "db/SaveModal";

export default function Heading(props) {
  const [modalActive, setModalActive] = useState(false);
  const id = useSelector(({ isSignedIn, id }) => id);
  return (
    <section class="hero">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">{props.title}</h1>
          {props.subtitle && <h2 class="subtitle">{props.subtitle}</h2>}

          <div class="field has-addons">
            <p class="control">
              <ShareButton getQuery={props.getQuery} />
            </p>
            <p class="control">
              <SaveButton onClick={(e) => setModalActive(true)} />
            </p>
          </div>
          <SaveModal
            isActive={modalActive}
            setActive={setModalActive}
            user={id}
            url={window.location.pathname}
            query={props.getQuery()}
          />
        </div>
      </div>
    </section>
  );
}
