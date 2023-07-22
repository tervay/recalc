import { Link } from "react-router-dom";

export type ImageSize = "4by3" | "square";
export default function Tile(props: {
  to: string;
  image?: string;
  title: string;
  imageSize?: ImageSize | string;
}): JSX.Element {
  return (
    <Link to={props.to}>
      <div className={"recalc-box"}>
        <div className="columns">
          <div className="column is-one-quarter">
            <figure
              className={[
                "image",
                props.imageSize === undefined
                  ? "is-4by3"
                  : `is-${props.imageSize}`,
              ].join(" ")}
            >
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
            className="column subtitle is-size-4"
            style={{ display: "flex", alignItems: "center" }}
          >
            {props.title}
          </div>
        </div>
      </div>
    </Link>
  );
}
