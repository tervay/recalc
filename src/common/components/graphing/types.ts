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
  NEO: tinycolor("#5abd7f"),
  "Falcon 500": tinycolor("#b553bc"),
  "Falcon 500 (FOC)": tinycolor("#64b647"),
  "Kraken X60*": tinycolor("#7166d9"),
  "Kraken X60 (FOC)*": tinycolor("#b4b331"),
  "Kraken X44*": tinycolor("#646db8"),
  "Minion*": tinycolor("#dd943c"),
  "NEO Vortex*": tinycolor("#5f9ed7"),
  "NEO 550": tinycolor("#d9562f"),
  "775pro": tinycolor("#4dbfb7"),
  "775 RedLine": tinycolor("#d3405a"),
  CIM: tinycolor("#3b804c"),
  MiniCIM: tinycolor("#d74d93"),
  BAG: tinycolor("#69792c"),
  "AM-9015": tinycolor("#c88ccf"),
  "BaneBots 550": tinycolor("#b9ae64"),
  Snowblower: tinycolor("#9f4d70"),
  "HD Hex": tinycolor("#976d33"),
  "Core Hex": tinycolor("#e48882"),
  "V5 Smart Motor (Red)": tinycolor("#aa4e34"),
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
