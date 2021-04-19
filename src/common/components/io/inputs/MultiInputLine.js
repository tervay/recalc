import propTypes from "prop-types";
import { Fragment } from "react";

export default function MultiInputLine(props) {
  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label">{props.label}</label>
      </div>
      <div className="field-body">
        {props.children.map((c) => {
          return <Fragment key={c.props.label}>{c}</Fragment>;
        })}
      </div>
    </div>
  );
}

MultiInputLine.propTypes = {
  label: propTypes.string,
  children: propTypes.array,
};
