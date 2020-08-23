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
    <nav className="level">
      <div className="level-item has-text-centered">
        <div>
          <p className="title">
            {props.title}{" "}
            <span className="tag is-primary">{props.subtitle}</span>
          </p>
        </div>
      </div>

      <div className="level-item has-text-centered">
        <div className="field has-addons">
          <p className="control">
            <ShareButton getQuery={props.getQuery} />
          </p>
          <p className="control">
            <SaveButton onClick={() => setModalActive(true)} />
          </p>

          <SaveModal
            isActive={modalActive}
            setActive={setModalActive}
            user={id}
            url={window.location.pathname}
            query={props.getQuery()}
          />
        </div>
      </div>
    </nav>
  );
}

Heading.propTypes = {
  title: propTypes.string.isRequired,
  subtitle: propTypes.string,
  getQuery: propTypes.func.isRequired,
};
