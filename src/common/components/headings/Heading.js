import ShareButton from "common/components/headings/ShareButton";
import propTypes from "prop-types";

export default function Heading(props) {
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
            <ShareButton getQuery={props.getQuery} />
          </p>
        </div>
      </div>
    </nav>
  );
}

Heading.propTypes = {
  title: propTypes.string.isRequired,
  subtitle: propTypes.string,
  getQuery: propTypes.func.isRequired,
};
