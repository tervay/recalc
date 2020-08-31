import styles from "index.scss";
import { defaults } from "lib/react-chart-js";

import { isLocalhost, uuid } from "./util";

defaults.global.defaultFontFamily = styles.font_family;

/**
 *
 * @param {{x: Number, y: Number}[]} data
 * @param {Number} numCharts
 */
export function makeDataObj(data, numCharts = 1) {
  let chartColors;
  // build compress removes the space
  // idk how to fix ?? 🤔
  if (isLocalhost()) {
    chartColors = styles.chart_colors.split(", ");
  } else {
    chartColors = styles.chart_colors.split(",");
  }

  return {
    datasets: data.map((d, indx) => ({
      data: d,
      cubicInterpolationMode: "monotone",
      fill: false,
      borderColor: chartColors[indx],
      key: uuid(),
      yAxisID: indx < numCharts ? String(indx) : undefined,
    })),
  };
}

export function horizontalMarker(at, from, to) {
  return [
    {
      x: from,
      y: at,
    },
    {
      x: to,
      y: at,
    },
  ];
}

export function verticalMarker(at, from, to) {
  return [
    {
      x: at,
      y: from,
    },
    {
      x: at,
      y: to,
    },
  ];
}

export function makeLineOptions(
  title,
  xTitle,
  yTitles,
  numCharts = 1,
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
      display: true,
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
      yAxes: [...Array(numCharts).keys()].map((k) => ({
        ticks: {
          beginAtZero: true,
        },
        scaleLabel: {
          display: true,
          labelString: yTitles[k],
        },
        id: String(k),
        position: ["left", "right", "left"][k],
        gridLines: {
          drawOnChartArea: k === 0, // only want the grid lines for one axis to show up
        },
      })),
    },
  };
}
