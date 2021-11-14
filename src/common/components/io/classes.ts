import {
  Colorable,
  Expandable,
  Loadable,
  Roundable,
  Sizable,
} from "common/components/io/new/inputs/types/Types";

export function getColorableClass<T extends Colorable>(c: T): string {
  if (c.successIf()) {
    return "is-success";
  }
  if (c.dangerIf()) {
    return "is-danger";
  }
  if (c.infoIf()) {
    return "is-info";
  }
  if (c.linkIf()) {
    return "is-link";
  }
  if (c.primaryIf()) {
    return "is-primary";
  }
  if (c.warningIf()) {
    return "is-warning";
  }

  return "";
}

export function getRoundClass<T extends Roundable>(c: T): string {
  return c.rounded ? "is-rounded" : "";
}

export function getSizeClass<T extends Sizable>(c: T): string {
  return `is-${c.size}`;
}

export function getLoadingClass<T extends Loadable>(c: T): string {
  return c.loadingIf() ? "is-loading" : "";
}

export function getExpandedClass<T extends Expandable>(c: T): string {
  return c.expanded ? "is-expanded" : "";
}
