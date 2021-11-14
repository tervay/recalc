import ArmCalculator from "web/calculators/arm/components/ArmCalculator";
import { ArmReadme } from "web/calculators/readmes";

export default function ArmPage(): JSX.Element {
  return (
    <>
      <ArmCalculator />
      <ArmReadme />
    </>
  );
}
