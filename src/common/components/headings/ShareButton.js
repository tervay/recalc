import { buildUrlForCurrentPage } from "common/tooling/query-strings";
import propTypes from "prop-types";

export default function ShareButton(props) {
  return (
    <button
      className="button is-primary has-text-white"
      onClick={() =>
        navigator.clipboard.writeText(buildUrlForCurrentPage(props.getQuery()))
      }
    >
      <span className="icon is-small">
        <i className="fas fa-link" />
      </span>
      <span>Copy link</span>
    </button>
  );
}

ShareButton.propTypes = {
  getQuery: propTypes.func.isRequired,
};
