import { FRCVendor, PulleyBeltType } from "common/models/ExtraTypes";
import Measurement, { MeasurementDict } from "common/models/Measurement";
import Model from "common/models/Model";

export type PulleyDict = {
  readonly teeth: number;
  readonly pitch: MeasurementDict;
};

type VendorData = {
  readonly vendors: FRCVendor[];
  readonly urls: string[];
  readonly type: PulleyBeltType;
  readonly widths: Measurement[];
  readonly bore: string;
};

export default class Pulley extends Model {
  public readonly teeth: number;
  public readonly pitch: Measurement;
  public readonly pitchDiameter: Measurement;
  public readonly vendors?: FRCVendor[];
  public readonly urls?: string[];
  public readonly type?: PulleyBeltType;
  public readonly widths?: Measurement[];
  public readonly bore?: string;

  constructor(
    teeth: number,
    pitch: Measurement,
    pitchDiameter: Measurement,
    vendorData?: VendorData
  ) {
    super("Pulley");
    this.teeth = teeth;
    this.pitch = pitch;
    this.pitchDiameter = pitchDiameter;
    this.vendors = vendorData?.vendors;
    this.urls = vendorData?.urls;
    this.type = vendorData?.type;
    this.widths = vendorData?.widths;
    this.bore = vendorData?.bore;
  }

  static fromTeeth(
    teeth: number,
    pitch: Measurement,
    vendorData?: VendorData
  ): Pulley {
    return new Pulley(teeth, pitch, pitch.mul(teeth).div(Math.PI), vendorData);
  }

  static fromPitchDiameter(
    pitchDiameter: Measurement,
    pitch: Measurement,
    vendorData?: VendorData
  ): Pulley {
    return new Pulley(
      Number(pitchDiameter.mul(Math.PI).div(pitch).scalar.toFixed(2)),
      pitch,
      pitchDiameter,
      vendorData
    );
  }

  toDict(): PulleyDict {
    return {
      teeth: this.teeth,
      pitch: this.pitch.toDict(),
    };
  }

  static fromDict(d: PulleyDict): Pulley {
    return Pulley.fromTeeth(d.teeth, Measurement.fromDict(d.pitch));
  }

  eq<M extends Model>(m: M): boolean {
    return (
      m instanceof Pulley && m.teeth == this.teeth && m.pitch.eq(this.pitch)
    );
  }
}
