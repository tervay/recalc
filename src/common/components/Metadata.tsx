import PageConfig from "common/models/PageConfig";
import { Helmet } from "react-helmet-async";

export default function Metadata(props: {
  pageConfig?: PageConfig;
  title?: string;
}): JSX.Element {
  if (props.pageConfig != undefined) {
    return (
      <Helmet>
        <title>ReCalc - {props.pageConfig.title}</title>
        <meta name="og:title" content={"ReCalc - " + props.pageConfig.title} />

        <link
          rel="canonical"
          href={window.location.origin + props.pageConfig.url}
        />
        <meta
          property="og:url"
          content={window.location.origin + props.pageConfig.url}
        />

        <meta
          property="og:image"
          content={window.location.origin + props.pageConfig.image + ".png"}
        />

        <meta
          name="description"
          content={"ReCalc (for FRC) - " + props.pageConfig.description}
        />
        <meta
          name="og:description"
          content={"ReCalc (for FRC) - " + props.pageConfig.description}
        />
      </Helmet>
    );
  } else {
    return (
      <Helmet>
        <title>ReCalc - {props.title}</title>
      </Helmet>
    );
  }
}
