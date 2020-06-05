import { buildUrlForCurrentPage } from "common/tooling/query-strings";
import React from "react";

export default function ShareButton(props) {
  return (
    <button
      class="button is-primary"
      onClick={() =>
        navigator.clipboard.writeText(buildUrlForCurrentPage(props.getQuery()))
      }
    >
      <span class="icon is-small">
        <i class="fas fa-link" />
      </span>
      <span>Copy link</span>
    </button>
  );
}
