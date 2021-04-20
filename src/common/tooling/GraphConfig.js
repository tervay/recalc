import styles from "exports.module.scss";
import { isLocalhost } from "common/tooling/util";

const chartColors = styles.chart_colors.split(isLocalhost() ? ", " : ",");

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

  static chartColor(index) {
    return chartColors[index];
  }

  static dataset({ label, data, colorIndex, id }) {
    return {
      label: label,
      data: data,
      borderColor: GraphConfig.chartColor(colorIndex),
      fill: false,
      cubicInterpolationMode: "monotone",
      yAxisID: id,
    };
  }
}
