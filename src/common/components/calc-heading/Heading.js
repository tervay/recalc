import { SaveButton } from "common/components/calc-heading/SaveButton";
import { SaveModal } from "common/components/calc-heading/SaveModal";
import ShareButton from "common/components/calc-heading/ShareButton";
import propTypes from "prop-types";
import React, { useState } from "react";
import { useSelector } from "redux-zero/react";

export default function Heading(props) {
  const [modalActive, setModalActive] = useState(false);
  const id = useSelector(({ id }) => id);

  return (
    <section className="hero">
      <div className="hero-body">
        <div className="container">
          <h1 className="title">{props.title}</h1>
          {props.subtitle && <h2 className="subtitle">{props.subtitle}</h2>}

          <div className="field has-addons">
            <p className="control">
              <ShareButton getQuery={props.getQuery} />
            </p>
            <p className="control">
              <SaveButton onClick={() => setModalActive(true)} />
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

Heading.propTypes = {
  title: propTypes.string.isRequired,
  subtitle: propTypes.string,
  getQuery: propTypes.func.isRequired,
};
