import ShareButton, {
  ShareButtonProps,
} from "common/components/heading/ShareButton";
import { BaseState } from "common/models/ExtraTypes";

export default function SimpleHeading<State extends BaseState>(
  props: {
    title: string;
  } & ShareButtonProps<State>,
): JSX.Element {
  return (
    <nav className="level">
      <div className="level-item has-text-centered">
        <div>
          <p className="title">{props.title}</p>
        </div>
      </div>

      <div className="level-item has-text-centered">
        <div className="field has-addons">
          <p className="control">
            <ShareButton {...props} />
          </p>
        </div>
      </div>
    </nav>
  );
}
