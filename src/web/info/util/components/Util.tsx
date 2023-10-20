import Bearings from "web/info/util/components/Bearings";
import { HoleSizes } from "web/info/util/components/HoleSizes";
import MountingCheatSheet from "web/info/util/components/MountingCheatSheet";

export default function Util(): JSX.Element {
  return (
    <>
      <HoleSizes />
      <MountingCheatSheet />
      <Bearings />
      {/* <ExtrusionPrices /> */}
    </>
  );
}
