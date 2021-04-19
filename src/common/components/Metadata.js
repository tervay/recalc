import PageConfig from "common/models/PageConfig";
import propTypes from "prop-types";
import { Helmet } from "react-helmet";

export default function Metadata(props) {
  return (
    <Helmet>
      <title>ReCalc - {props.config.title}</title>
      <link rel="canonical" href={window.location.origin + props.config.url} />
      <meta
        name="description"
        content={"ReCalc (for FRC) - " + props.config.description}
      />
    </Helmet>
  );
}

Metadata.propTypes = {
  config: propTypes.instanceOf(PageConfig),
};
