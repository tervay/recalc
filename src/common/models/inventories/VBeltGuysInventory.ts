import Belt from "common/models/Belt";
import _vbg from "common/models/data/inventories/VBeltGuys.json";
import Inventory, {
  AuthCallback,
  InventorySavedResult,
  WritableArray,
} from "common/models/inventories/Inventory";
import Measurement from "common/models/Measurement";
import { NoOp } from "common/tooling/util";
import { GoogleSpreadsheetRow } from "google-spreadsheet";

type VBeltGuysItem = {
  readonly teeth: number;
  readonly pitch: string;
  readonly width: string;
};

export type VBeltGuysResult = InventorySavedResult & VBeltGuysItem;

function beltToItem(b: Belt): VBeltGuysItem {
  if (b.width === undefined) {
    throw Error("Tried to save a belt without a width!");
  }

  return {
    pitch: b.pitch.to("mm").format(),
    teeth: b.teeth,
    width: b.width.to("mm").format(),
  };
}

export default class VBeltGuysInventory extends Inventory<
  Belt,
  VBeltGuysResult
> {
  constructor(
    args: {
      offlineData: VBeltGuysResult[] | null;
      authCb: AuthCallback<Belt, VBeltGuysResult> | null;
      allowAuth: boolean | null;
    } = {
      offlineData: _vbg,
      authCb: NoOp,
      allowAuth: false,
    }
  ) {
    super(
      "VBeltGuys",
      "1xaEbFEW0CWEI_hfGBuCB45w1Fsgo85pgfHAdkM7bNUA",
      args.offlineData !== null ? args.offlineData : _vbg,
      args.allowAuth !== null ? args.allowAuth : false,
      args.authCb !== null ? args.authCb : NoOp
    );
  }

  makeUrl(obj: Belt): string {
    const item = beltToItem(obj);
    const beltLength = Math.round(obj.length.to("mm").scalar);
    const pitchStr = item.pitch.replace(" mm", "m");
    const widthStr = item.width.replace(" mm", "").padStart(2, "0");

    return `https://www.vbeltguys.com/products/${beltLength}-${pitchStr}-${widthStr}-synchronous-timing-belt`;
  }

  shouldWrite(obj: Belt): boolean {
    return (
      obj.pitch.eq(new Measurement(3, "mm")) ||
      obj.pitch.eq(new Measurement(5, "mm"))
    );
  }

  makeArrayToWrite(obj: Belt): WritableArray {
    const item = beltToItem(obj);
    return [String(item.teeth), item.pitch, item.width, this.makeUrl(obj)];
  }

  rowToArray(row: GoogleSpreadsheetRow): WritableArray {
    return [
      row.teeth,
      row.pitch,
      row.width,
      row["generatedUrl"],
      row["responseCode"],
    ];
  }
}
