export default function Logo(props: {
  color?: "black" | "white";
  alignment?: "middle" | "bottom";
}): JSX.Element {
  const color = props.color ?? "black";
  const alignment = props.alignment ?? "middle";

  return (
    <span>
      <img
        src="/logo/motor.svg"
        className={["svg", `svg-${color}`].join(" ")}
        style={{ verticalAlign: alignment }}
      />
      <b>ReCalc (Preview)</b>
    </span>
  );
}
