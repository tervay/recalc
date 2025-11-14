import Model from '~/lib/models/Model';
import type { Bore } from '~/lib/types/common';
import type { JSONGear } from '~/lib/types/gears';

export default class Gear extends Model {
  constructor(
    public readonly teeth: number,
    public readonly dp: number,
    public readonly bore: Bore,
    public readonly url: string,
    public readonly sku: string | null,
    public readonly vendor: string,
  ) {
    super('Gear');
  }

  public static fromJson(json: JSONGear): Gear {
    return new Gear(
      json.teeth,
      json.dp,
      json.bore,
      json.url,
      json.sku,
      json.vendor,
    );
  }

  public toDict(): Record<string, unknown> {
    return {
      teeth: this.teeth,
      dp: this.dp,
      bore: this.bore,
    };
  }

  eq<M extends Model>(m: M): boolean {
    return (
      m instanceof Gear &&
      m.teeth === this.teeth &&
      m.dp === this.dp &&
      m.bore === this.bore &&
      m.url === this.url &&
      m.sku === this.sku &&
      m.vendor === this.vendor
    );
  }
}
