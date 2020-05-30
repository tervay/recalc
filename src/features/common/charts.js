import { defaults } from "../../rcjs/index";
import styles from "../../index.scss";

defaults.global.defaultFontFamily = styles.font_family;

export default function makeLineOptions(title, xTitle, yTitle) {
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
    maintainAspectRatio: false,
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
