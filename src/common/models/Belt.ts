import Measurement from "common/models/Measurement";
import Model from "common/models/Model";
import type { JSONBelt } from "common/models/types/belts";

export class SimpleBelt extends Model {
  public readonly length: Measurement;

  constructor(
    public readonly teeth: number,
    public readonly pitch: Measurement,
  ) {
    super("SimpleBelt");
    this.length = pitch.mul(teeth);
  }

  toDict(): Record<string, unknown> {
    return {
      teeth: this.teeth,
      pitch: this.pitch.toDict(),
    };
  }

  eq<M extends Model>(m: M): boolean {
    if (m instanceof SimpleBelt) {
      return this.teeth === m.teeth && this.pitch.eq(m.pitch);
    }

    return false;
  }
}

export default class Belt extends SimpleBelt {
  public readonly length: Measurement;

  constructor(
    public readonly teeth: number,
    public readonly pitch: Measurement,
    public readonly width: Measurement,
    public readonly profile: string,
    public readonly sku: string | null,
    public readonly url: string,
    public readonly vendor: string,
  ) {
    super(teeth, pitch);
    this.length = this.pitch.mul(this.teeth);
  }

  public static fromJson(json: JSONBelt): Belt {
    return new Belt(
      json.teeth,
      new Measurement(json.pitch, "mm"),
      new Measurement(json.width, "mm"),
      json.profile,
      json.sku,
      json.url,
      json.vendor,
    );
  }

  get type(): string {
    return this.profile;
  }

  toDict(): Record<string, unknown> {
    return {
      teeth: this.teeth,
      pitch: this.pitch.toDict(),
    };
  }

  eq<M extends Model>(m: M): boolean {
    if (m instanceof Belt) {
      return (
        this.teeth === m.teeth &&
        this.pitch.eq(m.pitch) &&
        this.width.eq(m.width) &&
        this.profile === m.profile &&
        this.vendor === m.vendor
      );
    }

    return false;
  }

}
