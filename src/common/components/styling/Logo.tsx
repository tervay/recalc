export default function Logo(props: {
  color?: "black" | "white";
  alignment?: "middle" | "bottom";
}): JSX.Element {
  const color = props.color ?? "black";

  return (
    <span>
      <img
        src="/logo/motor.svg"
        className={["svg", `svg-${color}`, "logo-img"].join(" ")}
      />
      <b className="logo-text">ReCalc</b>
      <div className="logo-subtitle has-text-centered">
        A collaboration focused mechanical design calculator.
      </div>
    </span>
  );
}
