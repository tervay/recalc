import { Chart, registerables } from "chart.js";
import * as ChartZoomPlugin from "chartjs-plugin-zoom";
import { ReactChart } from "chartjs-react";
import { isLocalhost } from "common/tooling/util";
import styles from "exports.module.scss";

Chart.defaults.font.family = styles.font_family;

if (registerables !== undefined) {
  ReactChart.register(...registerables, ChartZoomPlugin.Zoom);
}

export function Graph(props) {
  return <ReactChart {...props} />;
}
