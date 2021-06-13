import { GraphConfig } from "common/tooling/GraphConfig";

export class FlywheelConfig extends GraphConfig {
  static options() {
    return super.options(
      {
        y: {
          type: "linear",
          beginAtZero: true,
          title: {
            display: true,
            text: "Windup Time (s)",
          },
        },
        x: {
          type: "linear",
          beginAtZero: true,
          title: {
            display: true,
            text: "Reduction Ratio",
          },
        },
      },
      "Windup Time (s) vs Reduction Ratio"
    );
  }
}
