import { Icon } from "common/components/styling/Building";
import { StateHook } from "common/models/ExtraTypes";
import { useState } from "react";

export default function L0MultiBoolean(props: {
  label: string;
  options: {
    stateHook: StateHook<boolean>;
    name: string;
    icon?: string;
  }[];
}): JSX.Element {
  const [selected, setSelected] = useState(
    props.options.filter((o) => o.stateHook[0]).map((o) => o.name)
  );

  return (
    <article className="panel is-primary">
      <p className="panel-heading">{props.label}</p>
      {props.options.map((option) => (
        <a
          className={`panel-block ${
            selected.includes(option.name) ? "is-active" : ""
          }`}
          onClick={(e) => {
            e.preventDefault();
            if (selected.includes(option.name)) {
              setSelected(selected.filter((o) => o !== option.name));
            } else {
              setSelected([...selected, option.name]);
            }
          }}
          key={option.name}
        >
          <span className="panel-icon">
            <Icon name={"check-square"} />
          </span>

          {option.name}
        </a>
      ))}
    </article>
  );
}
