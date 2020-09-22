import propTypes from "prop-types";
import React from "react";

export default function Heading(props) {
  return (
    <div className="columns">
      <div className="column is-3 title front-text">{props.title}</div>
      <div
        className="column is-9 bg-image"
        style={{
          backgroundImage: `url("${props.image}.png")`,
          height: "100px",
        }}
      />
    </div>
  );
}

Heading.propTypes = {
  title: propTypes.string,
  image: propTypes.string,
};
