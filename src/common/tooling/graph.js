import { Chart, registerables } from "chart.js";
import * as ChartZoomPlugin from "chartjs-plugin-zoom";
import { ReactChart } from "chartjs-react";
import { isLocalhost } from "common/tooling/util";
import styles from "exports.module.scss";

Chart.defaults.font.family = styles.font_family;
const chartColors = styles.chart_colors.split(isLocalhost() ? ", " : ",");

ReactChart.register(...registerables, ChartZoomPlugin.Zoom);

export function chartColor(i) {
  return chartColors[i];
}

export function Graph(props) {
  return <ReactChart {...props} />;
}

export class GraphConfig {
  static options(scales, title) {
    return {
      scales: scales,
      elements: {
        point: {
          radius: 0,
        },
      },
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: Object.keys(scales).length > 2,
        },
        title: {
          display: true,
          text: title,
        },
        zoom: {
          pan: {
            enabled: true,
            mode: "xy",
          },
          zoom: {
            enabled: true,
            mode: "xy",
          },
        },
      },
    };
  }

  static dataset({ label, data, colorIndex, id }) {
    return {
      label: label,
      data: data,
      borderColor: chartColor(colorIndex),
      fill: false,
      cubicInterpolationMode: "monotone",
      yAxisID: id,
    };
  }
}
