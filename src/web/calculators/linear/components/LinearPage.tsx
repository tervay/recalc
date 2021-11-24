import Metadata from "common/components/Metadata";
import linearConfig from "web/calculators/linear";
import LinearCalculator from "web/calculators/linear/components/LinearCalculator";
import { LinearReadme } from "web/calculators/readmes";

export default function LinearPage(): JSX.Element {
  return (
    <>
      <Metadata pageConfig={linearConfig} />
      <LinearCalculator />
      <LinearReadme />
    </>
  );
}
