import Model from '~/lib/models/Model';
import type { Bore } from '~/lib/types/common';
import type { JSONPlanetary } from '~/lib/types/planetary';

export default class Planetary extends Model {
  constructor(
    public readonly slices: number[],
    public readonly maxSlices: number,
    public readonly inputBores: Bore[],
    public readonly outputBores: Bore[],
    public readonly sku: string,
    public readonly url: string,
    public readonly vendor: string,
  ) {
    super('Planetary');
  }

  public static fromJson(json: JSONPlanetary): Planetary {
    return new Planetary(
      json.slices,
      json.maxSlices,
      json.inputBores,
      json.outputBores,
      json.sku,
      json.url,
      json.vendor,
    );
  }

  toDict(): Record<string, unknown> {
    return {
      slices: this.slices,
      maxSlices: this.maxSlices,
      inputBores: this.inputBores,
      outputBores: this.outputBores,
    };
  }
  eq<M extends Model>(m: M): boolean {
    return (
      m instanceof Planetary &&
      this.slices === m.slices &&
      this.maxSlices === m.maxSlices &&
      this.inputBores === m.inputBores &&
      this.outputBores === m.outputBores
    );
  }
}
