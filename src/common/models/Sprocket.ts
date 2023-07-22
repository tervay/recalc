import { FRCVendor } from "common/models/ExtraTypes";
import Measurement, { MeasurementDict } from "common/models/Measurement";
import Model from "common/models/Model";
import { isEqual } from "lodash";

export type SprocketDict = {
  readonly teeth: number;
  readonly pitch: MeasurementDict;
};

type VendorData = {
  bore: string;
  wrong: boolean;
  vendors: FRCVendor[];
};

export default class Sprocket extends Model {
  public readonly pitchDiameter: Measurement;
  public readonly bore?: string;
  public readonly wrong?: boolean;
  public readonly vendors?: FRCVendor[];

  constructor(
    public readonly teeth: number,
    public readonly pitch: Measurement,
    vendorData?: VendorData,
  ) {
    super("Sprocket");
    this.pitchDiameter =
      teeth == 0
        ? new Measurement(0, "in")
        : pitch.div(Math.sin(Math.PI / teeth));
    this.bore = vendorData?.bore;
    this.wrong = vendorData?.wrong;
    this.vendors = vendorData?.vendors;
  }

  toDict(): SprocketDict {
    return {
      teeth: this.teeth,
      pitch: this.pitch.toDict(),
    };
  }

  static fromDict(d: SprocketDict): Sprocket {
    return new Sprocket(d.teeth, Measurement.fromDict(d.pitch));
  }

  eq<M extends Model>(m: M): boolean {
    return m instanceof Sprocket && isEqual(this.toDict(), m.toDict());
  }
}
