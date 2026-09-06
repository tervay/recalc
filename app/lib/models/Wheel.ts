import Measurement from '~/lib/models/Measurement';
import Model from '~/lib/models/Model';
import type { Vendor } from '~/lib/types/common';
import type { JSONWheel, WheelBore, WheelType } from '~/lib/types/wheels';

export default class Wheel extends Model {
  constructor(
    public readonly name: string,
    public readonly diameter: Measurement,
    public readonly bore: WheelBore,
    public readonly type: WheelType,
    public readonly durometer: string | null,
    public readonly url: string,
    public readonly sku: string | null,
    public readonly vendor: Vendor,
  ) {
    super('Wheel');
  }

  public static fromJson(json: JSONWheel): Wheel {
    return new Wheel(
      json.name,
      new Measurement(json.diameter, 'mm'),
      json.bore,
      json.type,
      json.durometer,
      json.url,
      json.sku,
      json.vendor,
    );
  }

  public toDict(): Record<string, unknown> {
    return {
      name: this.name,
      diameter: this.diameter.toDict(),
      bore: this.bore,
      type: this.type,
      durometer: this.durometer,
    };
  }

  eq(m: Model): boolean {
    return (
      m instanceof Wheel &&
      m.name === this.name &&
      this.diameter.eq(m.diameter) &&
      m.bore === this.bore &&
      m.type === this.type &&
      m.durometer === this.durometer &&
      m.url === this.url &&
      m.sku === this.sku &&
      m.vendor === this.vendor
    );
  }
}
