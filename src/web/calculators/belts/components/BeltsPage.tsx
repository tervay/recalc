import Metadata from "common/components/Metadata";
import beltsConfig from "web/calculators/belts";
import Calculator from "web/calculators/belts/components/BeltsCalculator";
import { BeltsReadme } from "web/calculators/readmes";

export default function Belts(): JSX.Element {
  return (
    <>
      <Metadata pageConfig={beltsConfig} />
      <Calculator />
      <BeltsReadme />
    </>
  );
}
