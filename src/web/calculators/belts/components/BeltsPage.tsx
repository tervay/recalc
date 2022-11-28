import Metadata from "common/components/Metadata";
import TypedMotor from "common/models/TypedMotor";
import {
  amperes,
  inches,
  newtonmeters,
  pounds,
  rpm,
} from "common/models/units";
import beltsConfig from "web/calculators/belts";
import Calculator from "web/calculators/belts/components/BeltsCalculator";
import { BeltsReadme } from "web/calculators/readmes";

export default function Belts(): JSX.Element {
  const x: TypedMotor = new TypedMotor(
    "flaconwer",
    rpm(100),
    newtonmeters(10),
    amperes(100),
    amperes(0.1),
    pounds(1.25),
    "",
    inches(2),
    1
  );

  return (
    <>
      <Metadata pageConfig={beltsConfig} />
      <Calculator />
      <BeltsReadme />
      {x.kV.toString()}
    </>
  );
}
