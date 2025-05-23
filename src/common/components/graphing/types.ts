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

export function motorColor(id: string): tinycolor.Instance {
  return (motorColors[id] ?? tinycolor("grey")).clone();
}

// generated from: https://medialab.github.io/iwanthue/
const motorColors: Record<string, tinycolor.Instance> = {
  NEO: tinycolor("#c75980"),
  "Falcon 500": tinycolor("#72ae43"),
  "Falcon 500 (FOC)": tinycolor("#7968d7"),
  "Kraken X60": tinycolor("#ce872d"),
  "Kraken X60 (FOC)": tinycolor("#698fca"),
  "Kraken X44": tinycolor("#cc594c"),
  "Minion": tinycolor("#4aaa86"),
  "NEO Vortex": tinycolor("#b963b7"),
  "NEO 550": tinycolor("#96894a"),
  "775pro": tinycolor("#cf5439"),
  "775 RedLine": tinycolor("#49adaa"),
  CIM: tinycolor("#c35ea5"),
  MiniCIM: tinycolor("#8aaf35"),
  BAG: tinycolor("#8472cc"),
  "AM-9015": tinycolor("#ce8f30"),
  "BaneBots 550": tinycolor("#ca586f"),
  NeveRest: tinycolor("#5ea158"),
  Snowblower: tinycolor("#a8824c"),
  "HD Hex": tinycolor("#cc545e"),
  "Core Hex": tinycolor("#64a860"),
  "V5 Smart Motor (Red)": tinycolor("#9970c1"),
  "Modern Robotics": tinycolor("#b98d3e"),
};

const chartColors: Record<number, tinycolor.Instance> =
  Motor.getAllChoices().reduce(
    (prev, curr, i) => ({
      ...prev,
      [i + 1]: motorColor(curr),
      [i + 1 + 100]: motorColor(curr).darken(3),
      [i + 1 + 200]: motorColor(curr).darken(6),
    }),
    {},
  );

export function webworkerDataset(
  label: string,
  data: { x: number; y: number }[],
  colorIndex: number,
  id: string,
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
