import propTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";

export default function Tile(props) {
  return (
    <Link to={props.to}>
      <div className={"box"}>
        <article className="media">
          <figure className="media-left">
            <figure className="image is-128x128">
              <picture>
                {props.image && (
                  <>
                    <source type="image/webp" srcSet={props.image + ".webp"} />
                    <source type="image/png" srcSet={props.image + ".png"} />
                  </>
                )}
                <img
                  src={
                    (props.image ||
                      "https://bulma.io/images/placeholders/128x128") + ".png"
                  }
                  alt={props.title}
                />
              </picture>
            </figure>
          </figure>
          <div className="media-content">
            <div className="content">
              <p>
                <strong className={"title"}>{props.title}</strong>
              </p>
            </div>
          </div>
        </article>
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
