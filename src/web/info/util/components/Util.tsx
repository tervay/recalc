import { HoleSizes } from "web/info/util/components/HoleSizes";
import MountingCheatSheet from "web/info/util/components/MountingCheatSheet";
import SpacerCalc from "web/info/util/components/Spacers";

export default function Util(): JSX.Element {
  return (
    <>
      <HoleSizes />
      <SpacerCalc />
      <MountingCheatSheet />
    </>
  );
}
