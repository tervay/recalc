import Metadata from "common/components/Metadata";
import pneumaticsConfig from "web/calculators/pneumatics";
import PneumaticsCalculator from "web/calculators/pneumatics/components/PneumaticsCalculator";
import { PneumaticsReadme } from "web/calculators/readmes";

export default function Pneumatics(): JSX.Element {
  return (
    <>
      <Metadata pageConfig={pneumaticsConfig} />
      <PneumaticsCalculator />
      <PneumaticsReadme />
    </>
  );
}
