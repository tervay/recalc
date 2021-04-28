import { Chart, registerables } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { ReactChart } from "chartjs-react";
import styles from "exports.module.scss";

Chart.defaults.font.family = styles.font_family;

ReactChart.register(...registerables, zoomPlugin);

export function Graph(props) {
  return <ReactChart {...props} />;
}
