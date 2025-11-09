import Measurement from '~/lib/models/Measurement';
import Model from '~/lib/models/Model';
import type { Bore } from '~/lib/types/common';
import type { JSONPulley } from '~/lib/types/pulleys';

export class SimplePulley extends Model {
  public readonly pitchDiameter: Measurement;

  constructor(
    public readonly teeth: number,
    public readonly pitch: Measurement,
  ) {
    super('SimplePulley');
    this.pitchDiameter = this.pitch.mul(this.teeth).div(Math.PI);
  }

  public toDict(): Record<string, unknown> {
    return {
      teeth: this.teeth,
      pitch: this.pitch.toDict(),
    };
  }

  eq<M extends Model>(m: M): boolean {
    return (
      m instanceof SimplePulley &&
      m.teeth === this.teeth &&
      this.pitch.eq(m.pitch)
    );
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
      new Measurement(json.width, 'mm'),
      json.profile,
      new Measurement(json.pitch, 'mm'),
      json.sku,
      json.url,
      json.bore,
      json.vendor,
    );
  }

  public toDict(): Record<string, unknown> {
    return {
      teeth: this.teeth,
      pitch: this.pitch.toDict(),
    };
  }

  eq<M extends Model>(m: M): boolean {
    return (
      m instanceof Pulley &&
      m.teeth === this.teeth &&
      this.pitch.eq(m.pitch) &&
      this.width.eq(m.width) &&
      m.profile === this.profile &&
      m.sku === this.sku &&
      m.url === this.url &&
      m.bore === this.bore &&
      m.vendor === this.vendor
    );
  }
}
