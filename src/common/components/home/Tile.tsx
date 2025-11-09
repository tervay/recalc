import { Link } from "react-router-dom";

export default function Tile(props: {
  to: string;
  title: string;
}): JSX.Element {
  return (
    <Link to={props.to}>
      <div className={"recalc-box"}>
        <div
          className="subtitle is-size-4"
          style={{ display: "flex", alignItems: "center", padding: "1rem" }}
        >
          {props.title}
        </div>
      </div>
    </Link>
  );
}
