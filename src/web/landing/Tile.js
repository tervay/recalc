import propTypes from "prop-types";
import { Link } from "react-router-dom";

export default function Tile(props) {
  return (
    <Link to={props.to}>
      <div className={"recalc-box"}>
        <div className="columns">
          <div className="column is-one-quarter">
            <figure className="image is-4by3">
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
                      "https://bulma.io/images/placeholders/1280x960") + ".png"
                  }
                  alt={props.title}
                />
              </picture>
            </figure>
          </div>
          <div
            className="column subtitle"
            style={{ display: "flex", alignItems: "center" }}
          >
            {props.title}
          </div>
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
