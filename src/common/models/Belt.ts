import _frcBelts from "common/models/data/belts.json";
import _vbg from "common/models/data/inventories/VBeltGuys.json";
import { FRCVendor, PulleyBeltType } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import Model from "common/models/Model";
import { cleanFloatingPointErrors } from "common/tooling/io";
import { isEqual } from "lodash";

type VendorData = {
  vendor: FRCVendor;
  type: PulleyBeltType;
  sku: string;
  url: string;
};

export default class Belt extends Model {
  public readonly vendor?: FRCVendor;
  public readonly type?: PulleyBeltType;
  public readonly sku?: string;
  public readonly url?: string;

  constructor(
    public readonly teeth: number,
    public readonly pitch: Measurement,
    public readonly length: Measurement,
    public readonly width?: Measurement,
    vendorData?: VendorData
  ) {
    super("Belt");
    this.vendor = vendorData?.vendor;
    this.type = vendorData?.type;
    this.sku = vendorData?.sku;
    this.url = vendorData?.url;
  }

  static fromTeeth(
    teeth: number,
    pitch: Measurement,
    width?: Measurement,
    vendorData?: VendorData
  ): Belt {
    return new Belt(teeth, pitch, pitch.mul(teeth), width, vendorData);
  }

  static fromLength(
    length: Measurement,
    pitch: Measurement,
    width?: Measurement,
    vendorData?: VendorData
  ): Belt {
    return new Belt(
      cleanFloatingPointErrors(length.div(pitch).scalar),
      pitch,
      length,
      width,
      vendorData
    );
  }

  toDict(): Record<string, unknown> {
    return {
      teeth: this.teeth,
      pitch: this.pitch.toDict(),
    };
  }

  eq<M extends Model>(m: M): boolean {
    return m instanceof Belt && isEqual(m.toDict(), this.toDict());
  }

  static getAllBelts(include_vbg = false): Belt[] {
    const frcBelts = _frcBelts.map((b) =>
      Belt.fromTeeth(
        b.teeth,
        new Measurement(Number(b.pitch.replace(" mm", "")), "mm"),
        new Measurement(Number(b.width.replace(" mm", "")), "mm"),
        {
          sku: b.sku,
          type: b.type as PulleyBeltType,
          url: b.url,
          vendor: b.vendor as FRCVendor,
        }
      )
    );
    const vbgBelts = include_vbg
      ? [...new Set(_vbg.filter((b) => b.responseCode === 200))].map((b) =>
          Belt.fromTeeth(
            b.teeth,
            new Measurement(Number(b.pitch.replace(" mm", "")), "mm"),
            new Measurement(Number(b.width.replace(" mm", "")), "mm"),
            {
              url: b.generatedUrl,
              vendor: "VBeltGuys",
              sku: b.generatedUrl.split("/")[b.generatedUrl.split("/").length],
              type: "HTD",
            }
          )
        )
      : [];

    return frcBelts.concat(vbgBelts);
  }
}
