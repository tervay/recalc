import React from "react";
import { Link } from "react-router-dom";

export default function Tile(props) {
  return (
    <Link to={props.to}>
      <div class="card">
        <div class="card-image">
          <figure class="image is-4by3">
            <img
              src={
                props.image ||
                "https://bulma.io/images/placeholders/1280x960.png"
              }
              alt="Placeholder image"
            />
          </figure>
        </div>
        <div class="card-content">
          <p class="title is-4">{props.title}</p>
          <p class="subtitle is-6">{props.subtitle}</p>
        </div>
      </div>
    </Link>
  );
}
