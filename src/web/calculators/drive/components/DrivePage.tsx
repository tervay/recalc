import Metadata from "common/components/Metadata";
import driveConfig from "web/calculators/drive";
import DriveCalculator from "web/calculators/drive/components/DriveCalculator";

export default function DrivePage(): JSX.Element {
  return (
    <>
      <Metadata pageConfig={driveConfig} />
      <DriveCalculator />
    </>
  );
}
