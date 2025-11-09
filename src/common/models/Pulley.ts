import Measurement from "common/models/Measurement";
import Model from "common/models/Model";
import type { Bore } from "common/models/types/common";
import type { JSONPulley, PulleyDict } from "common/models/types/pulleys";

export class SimplePulley extends Model {
  public readonly pitchDiameter: Measurement;

  constructor(
    public readonly teeth: number,
    public readonly pitch: Measurement,
  ) {
    super("SimplePulley");
    this.pitchDiameter = this.pitch.mul(this.teeth).div(Math.PI);
  }

  public toDict(): Record<string, unknown> {
    return {
      teeth: this.teeth,
      pitch: this.pitch.toDict(),
    };
  }

  eq<M extends Model>(_m: M): boolean {
    if (_m instanceof SimplePulley) {
      return this.teeth === _m.teeth && this.pitch.eq(_m.pitch);
    }

    return false;
  }
}

export default class Pulley extends SimplePulley {
  constructor(
    public readonly teeth: number,
    public readonly width: Measurement,
    public readonly profile: string,
    public readonly pitch: Measurement,
    public readonly sku: string | null,
    public readonly url: string,
    public readonly bore: Bore,
    public readonly vendor: string,
  ) {
    super(teeth, pitch);
  }

  public static fromJson(json: JSONPulley): Pulley {
    return new Pulley(
      json.teeth,
      Measurement.fromDict(json.width),
      json.profile,
      Measurement.fromDict(json.pitch),
      json.sku,
      json.url,
      json.bore,
      json.vendor,
    );
  }

  public static fromDict(d: PulleyDict): SimplePulley {
    return new SimplePulley(d.teeth, Measurement.fromDict(d.pitch));
  }

  public toDict(): PulleyDict {
    return {
      teeth: this.teeth,
      pitch: this.pitch.toDict(),
    };
  }

  eq<M extends Model>(_m: M): boolean {
    if (_m instanceof Pulley) {
      return (
        this.teeth === _m.teeth &&
        this.pitch.eq(_m.pitch) &&
        this.width.eq(_m.width) &&
        this.profile === _m.profile &&
        this.bore === _m.bore &&
        this.vendor === _m.vendor
      );
    }

    return false;
  }
}

export type { PulleyDict };
