import { Link } from "react-router-dom";

export default function Logo(props: {
  color?: "black" | "white";
  alignment?: "middle" | "bottom";
  link?: boolean;
}): JSX.Element {
  const color = props.color ?? "black";
  const alignment = props.alignment ?? "middle";

  const child = (
    <>
      <img
        src="/logo/motor.svg"
        className={["svg", `svg-${color}`].join(" ")}
        style={{ verticalAlign: alignment }}
      />
      <span className={`text-${props.color}`}>ReCalc (Beta)</span>
    </>
  );

  return props.link ? (
    <Link className="flex items-center" to={"/"}>
      {child}
    </Link>
  ) : (
    <div className="flex items-center">{child}</div>
  );
}
