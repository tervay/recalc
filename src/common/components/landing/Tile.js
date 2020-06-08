import propTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";

export default function Tile(props) {
  return (
    <Link to={props.to}>
      <div className="card">
        <div className="card-image">
          <figure className="image is-4by3">
            <img
              src={
                props.image ||
                "https://bulma.io/images/placeholders/1280x960.png"
              }
              alt="Placeholder image"
            />
          </figure>
        </div>
        <div className="card-content">
          <p className="title is-4">{props.title}</p>
          <p className="subtitle is-6">{props.subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

Tile.propTypes = {
  to: propTypes.string,
  image: propTypes.string,
  title: propTypes.string,
  subtitle: propTypes.string,
};
