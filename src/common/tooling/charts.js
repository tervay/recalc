import styles from "index.scss";
import { defaults } from "lib/react-chart-js";

defaults.global.defaultFontFamily = styles.font_family;

/**
 *
 * @param {{x: number, y: number}[]} data
 */
export function makeDataObj(data) {
  return {
    datasets: data.map((d) => ({
      data: d,
      cubicInterpolationMode: "monotone",
      fill: false,
      borderColor: styles.primary,
    })),
  };
}

export function makeLineOptions(
  title,
  xTitle,
  yTitle,
  maintainAspectRatio = false
) {
  return {
    elements: {
      line: {
        tension: 0,
      },
      point: {
        radius: 0,
      },
    },
    title: {
      display: true,
      text: title,
    },
    legend: {
      display: false,
    },
    maintainAspectRatio: maintainAspectRatio,
    responsive: true,
    scales: {
      xAxes: [
        {
          type: "linear",
          position: "bottom",
          scaleLabel: {
            display: true,
            labelString: xTitle,
          },
          ticks: {
            beginAtZero: true,
          },
        },
      ],
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
          },
          scaleLabel: {
            display: true,
            labelString: yTitle,
          },
        },
      ],
    },
  };
}
