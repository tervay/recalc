import Motor from "common/models/Motor";
import tinycolor from "tinycolor2";

export type EzDataset = {
  label: string;
  data: { x: number; y: number }[];
  borderColor: string;
  fill: boolean;
  cubicInterpolationMode: "monotone" | "default";
  yAxisID: string;
};

const motorColors: Record<string, tinycolor.Instance> = {
  "Falcon 500": tinycolor("red").darken(),
  NEO: tinycolor("black"),
  "NEO 550": tinycolor("orange").darken(20),
  "775pro": tinycolor("green"),
  "775 RedLine": tinycolor("blue"),
  CIM: tinycolor("purple"),
  MiniCIM: tinycolor("salmon"),
};

const chartColors: Record<number, tinycolor.Instance> =
  Motor.getAllChoices().reduce(
    (prev, curr, i) => ({
      ...prev,
      [i + 1]: motorColors[curr] ?? tinycolor("grey"),
      [i + 1 + 100]: (motorColors[curr] ?? tinycolor("grey")).triad()[1],
      [i + 1 + 200]: (motorColors[curr] ?? tinycolor("grey")).triad()[2],
    }),
    //   [i + 1 + 100]: (motorColors[curr] ?? tinycolor("grey"))
    //     .clone()
    //     .brighten(30),
    //   [i + 1 + 200]: (motorColors[curr] ?? tinycolor("grey"))
    //     .clone()
    //     .brighten(60),
    // }),
    {}
  );

export function webworkerDataset(
  label: string,
  data: { x: number; y: number }[],
  colorIndex: number,
  id: string
): EzDataset {
  return {
    label: label,
    data: data,
    borderColor: chartColors[colorIndex].toRgbString(),
    fill: false,
    cubicInterpolationMode: "monotone",
    yAxisID: id,
  };
}
