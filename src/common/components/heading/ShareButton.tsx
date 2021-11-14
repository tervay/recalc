import { BaseState } from "common/models/ExtraTypes";
import { URLifier } from "common/tooling/conversion";
import { buildUrlForCurrentPage } from "common/tooling/util";
import { QueryParamConfigMap } from "serialize-query-params";

export type ShareButtonProps<State extends BaseState> = {
  queryParams: QueryParamConfigMap;
  state: State;
};

export default function ShareButton<State extends BaseState>(
  props: ShareButtonProps<State>
): JSX.Element {
  return (
    <button
      className="button is-primary has-text-white"
      onClick={() =>
        navigator.clipboard.writeText(
          buildUrlForCurrentPage(URLifier(props.queryParams, props.state))
        )
      }
    >
      <span className="icon is-small">
        <i className="fas fa-link" />
      </span>
      <span>Copy Link</span>
    </button>
  );
}
