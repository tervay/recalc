import { parse } from "common/tooling/md";
import React, { useState } from "react";
import { SetOptional } from "type-fest";

/* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
export type ValidChildren = any;

type Color = "primary" | "link" | "info" | "success" | "warning" | "danger";
type Size = "small" | "normal" | "medium" | "large";

interface BuildingProps {
  children: ValidChildren;
  marginLess?: boolean;
  paddingLess?: boolean;
  extraClasses?: string;
}

function globalClasses(
  props: Omit<BuildingProps, "children">,
  otherClasses: string
): string {
  const classes = [otherClasses, props.extraClasses];
  if (props.marginLess) {
    classes.push("remove-margin");
  }
  if (props.paddingLess) {
    classes.push("remove-padding");
  }

  return classes.join(" ");
}

type OptionalChildren = SetOptional<BuildingProps, "children">;

function colorToClass(c: Color): string {
  return `is-${c}`;
}

function sizeToClass(s: Size): string {
  return `is-${s}`;
}

export function Block(props: BuildingProps): JSX.Element {
  return <div className="block">{props.children}</div>;
}

export function Columns(
  props: OptionalChildren & {
    formColumns?: boolean;
    centered?: boolean;
    multiline?: boolean;
    vcentered?: boolean;
    gapless?: boolean;
    mobile?: boolean;
    desktop?: boolean;
  }
): JSX.Element {
  const classes = ["grid", `grid-cols-${props.children.length}`];
  if (props.formColumns) {
    classes.push("form-columns");
  }
  if (props.centered) {
    classes.push("is-centered");
  }
  if (props.multiline) {
    classes.push("is-multiline");
  }
  if (props.vcentered) {
    classes.push("is-vcentered");
  }
  if (props.gapless) {
    classes.push("is-gapless");
  }
  if (props.mobile) {
    classes.push("is-mobile");
  }
  if (props.desktop) {
    classes.push("is-desktop");
  }

  return (
    <div className={globalClasses(props, classes.join(" "))}>
      {props.children}
    </div>
  );
}

type Percentage = 1 | 0.8 | 0.75 | 0.67 | 0.6 | 0.5 | 0.4 | 0.33 | 0.25 | 0.2;
export function Column(
  props: OptionalChildren & {
    percentage?: Percentage;
    ofTwelve?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    narrow?: boolean;
    fullhdPercentage?: Percentage;
    widescreenPercentage?: Percentage;
    desktopPercentage?: Percentage;
    tabletPercentage?: Percentage;
    mobilePercentage?: Percentage;
  }
): JSX.Element {
  const classes = ["column"];
  const pctMap = {
    1: "is-full",
    0.8: "is-four-fifths",
    0.75: "is-three-quarters",
    0.67: "is-two-thirds",
    0.6: "is-three-fifths",
    0.5: "is-half",
    0.4: "is-two-fifths",
    0.33: "is-one-third",
    0.25: "is-one-quarter",
    0.2: "is-one-fifth",
  };
  if (props.percentage !== undefined) {
    classes.push(pctMap[props.percentage]);
  }
  if (props.fullhdPercentage !== undefined) {
    classes.push(`${pctMap[props.fullhdPercentage]}-fullhd`);
  }
  if (props.widescreenPercentage !== undefined) {
    classes.push(`${pctMap[props.widescreenPercentage]}-widescreen`);
  }
  if (props.desktopPercentage !== undefined) {
    classes.push(`${pctMap[props.desktopPercentage]}-widescreen`);
  }
  if (props.tabletPercentage !== undefined) {
    classes.push(`${pctMap[props.tabletPercentage]}-widescreen`);
  }
  if (props.mobilePercentage !== undefined) {
    classes.push(`${pctMap[props.mobilePercentage]}-widescreen`);
  }

  if (props.ofTwelve !== undefined) {
    classes.push(`is-${props.ofTwelve}`);
  }

  if (props.narrow) {
    classes.push("is-narrow");
  }

  return (
    <div className={globalClasses(props, classes.join(" "))}>
      {props.children}
    </div>
  );
}

export function Level(props: BuildingProps): JSX.Element {
  return <nav className={globalClasses(props, "level")}>{props.children}</nav>;
}

export function LevelLeft(props: BuildingProps): JSX.Element {
  return <div className="level-left">{props.children}</div>;
}

export function LevelRight(props: BuildingProps): JSX.Element {
  return <div className="level-right">{props.children}</div>;
}

export function LevelItem(props: BuildingProps): JSX.Element {
  return <span className="level-item has-text-centered">{props.children}</span>;
}

export function Panel(
  props: BuildingProps & {
    heading: JSX.Element;
    color?: Color;
    removeInternalBorders?: boolean;
  }
): JSX.Element {
  if (!Array.isArray(props.children)) {
    props = { ...props, children: [props.children as JSX.Element] };
  }

  const classes = ["panel"];
  if (props.color) {
    classes.push(colorToClass(props.color));
  }
  if (props.removeInternalBorders) {
    classes.push("panel-remove-internal-borders");
  }

  return (
    <nav className={classes.join(" ")}>
      <div className="panel-heading">{props.heading}</div>
      {(props.children as JSX.Element[]).map((c) => (
        <div className="panel-block" key={c.key}>
          {c}
        </div>
      ))}
    </nav>
  );
}

export function Icon(props: { name: string }): JSX.Element {
  return <i className={`fas fa-${props.name}`} />;
}

export function Button(
  props: BuildingProps & {
    color?: Color;
    size?: Size;
    light?: boolean;
    outlined?: boolean;
    inverted?: boolean;
    rounded?: boolean;
    loading?: boolean;
    static?: boolean;
    disabled?: boolean;
    faIcon?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
  }
): JSX.Element {
  const innerText = props.faIcon ? (
    <>
      <span className="icon">
        <Icon name={props.faIcon} />
      </span>
      <span>{props.children}</span>
    </>
  ) : (
    props.children
  );

  const classes = ["button"];
  if (props.light) {
    classes.push("is-light");
  }
  if (props.outlined) {
    classes.push("is-outlined");
  }
  if (props.inverted) {
    classes.push("is-inverted");
  }
  if (props.rounded) {
    classes.push("is-rounded");
  }
  if (props.loading) {
    classes.push("is-loading");
  }
  if (props.static) {
    classes.push("is-static");
  }
  if (props.color) {
    classes.push(colorToClass(props.color));
  }
  if (props.size) {
    classes.push(sizeToClass(props.size));
  }

  return (
    <button
      className={classes.join(" ")}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {innerText}
    </button>
  );
}

export function Title(props: BuildingProps): JSX.Element {
  return <div className="title">{props.children}</div>;
}

export function Subtitle(props: BuildingProps): JSX.Element {
  return <div className="subtitle">{props.children}</div>;
}

export function Section(props: BuildingProps): JSX.Element {
  return (
    <section className={globalClasses(props, "section")}>
      {props.children}
    </section>
  );
}

export function Content(props: BuildingProps): JSX.Element {
  return (
    <div className={"content " + props.extraClasses}>{props.children}</div>
  );
}

export function UL(props: BuildingProps): JSX.Element {
  return (
    <Content>
      <ul>{props.children}</ul>
    </Content>
  );
}

export function Collapsible2(
  props: BuildingProps & { title: string }
): JSX.Element {
  const [expanded, setExpanded] = useState(false);

  const body = expanded ? (
    <div className="card-content">
      <div className="content">{props.children}</div>
    </div>
  ) : (
    <></>
  );

  return (
    <a className="card" onClick={() => setExpanded(!expanded)}>
      <header className="card-header">
        <p className="card-header-title">
          <Title>{props.title}</Title>
        </p>
        <div className="card-header-icon">
          <span className="icon">
            <Icon name={"arrows-alt-v"} />
          </span>
        </div>
      </header>
      {body}
    </a>
  );
}

export function Collapsible(
  props: BuildingProps & { title: string }
): JSX.Element {
  const [expanded, setExpanded] = useState(false);

  const body = expanded ? (
    <div className="message-body">
      <div className="content">{props.children}</div>
    </div>
  ) : (
    <></>
  );

  return (
    <article className="message ">
      <div
        className="message-header clickable"
        onClick={() => setExpanded(!expanded)}
      >
        <p className="is-size-4">
          {props.title}
          {expanded ? "" : " (click me to expand)"}
        </p>
        <Icon name={"arrows-alt-v"} />
      </div>
      {body}
    </article>
  );
}

export function Markdown(
  props: OptionalChildren & { markdownContent: string }
): JSX.Element {
  const content = parse(props.markdownContent);
  const sections = content.map((md) => (
    <Collapsible title={md.title} key={md.title}>
      <div dangerouslySetInnerHTML={{ __html: md.content }} />
    </Collapsible>
  ));

  return <>{sections}</>;
}

export function Divider(props: BuildingProps & { color?: Color }): JSX.Element {
  const classes = ["divider", props.color ? colorToClass(props.color) : ""];
  return (
    <div className={globalClasses(props, classes.join(" "))}>
      {props.children}
    </div>
  );
}

export function Message(
  props: BuildingProps & {
    title?: string;
    size?: Size;
    color?: Color;
  }
): JSX.Element {
  const header =
    props.title === undefined ? (
      <></>
    ) : (
      <div className="message-header">
        <p>{props.title}</p>
      </div>
    );
  return (
    <article
      className={[
        "message",
        props.color === undefined ? "" : colorToClass(props.color),
        props.size === undefined ? "" : sizeToClass(props.size),
      ].join(" ")}
    >
      {header}
      <div className="message-body">{props.children}</div>
    </article>
  );
}

export function Footer(props: BuildingProps): JSX.Element {
  return (
    <footer className="footer remove-padding">
      <Content extraClasses="has-text-centered">{props.children}</Content>
    </footer>
  );
}
