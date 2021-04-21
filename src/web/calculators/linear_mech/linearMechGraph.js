import { GraphConfig } from "common/tooling/GraphConfig";

export class LinearMechGraphConfig extends GraphConfig {
  static options() {
    return super.options(
      {
        y1: {
          type: "linear",
          beginAtZero: true,
          title: {
            display: true,
            text: "Time (s)",
          },
          position: "left",
        },
        y2: {
          type: "linear",
          beginAtZero: false,
          title: {
            display: true,
            text: "Current (A)",
          },
          position: "right",
          grid: {
            drawOnChartArea: false,
          },
        },
        x: {
          type: "linear",
          beginAtZero: true,
          title: {
            display: true,
            text: "Ratio",
          },
        },
      },
      "Time to Goal (s) / Current (A) vs Ratio"
    );
  }
}
