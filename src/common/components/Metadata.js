import PageConfig from "common/models/PageConfig";
import propTypes from "prop-types";
import { Helmet } from "react-helmet";

export default function Metadata(props) {
  return (
    <Helmet>
      <title>ReCalc - {props.config.title}</title>
      <meta name="og:title" content={"ReCalc -" + props.config.title} />

      <link rel="canonical" href={window.location.origin + props.config.url} />
      <meta
        property="og:url"
        content={window.location.origin + props.config.url}
      />

      <meta
        property="og:image"
        content={window.location.origin + props.config.image + ".png"}
      />

      <meta
        name="description"
        content={"ReCalc (for FRC) - " + props.config.description}
      />
      <meta
        name="og:description"
        content={"ReCalc (for FRC) - " + props.config.description}
      />
    </Helmet>
  );
}

Metadata.propTypes = {
  config: propTypes.instanceOf(PageConfig),
};
