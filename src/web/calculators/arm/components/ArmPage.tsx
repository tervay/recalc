import Metadata from "common/components/Metadata";
import armConfig from "web/calculators/arm";
import ArmCalculator from "web/calculators/arm/components/ArmCalculator";
import { ArmReadme } from "web/calculators/readmes";

export default function ArmPage(): JSX.Element {
  return (
    <>
      <Metadata pageConfig={armConfig} />
      <ArmCalculator />
      <ArmReadme />
    </>
  );
}
