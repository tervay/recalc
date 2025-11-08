import Measurement from "common/models/Measurement";
import Model from "common/models/Model";
import type { Bore } from "common/models/types/common";
import type { JSONSprocket } from "common/models/types/sprockets";

export class SimpleSprocket extends Model {
  public readonly pitch: Measurement;
  public readonly pitchDiameter: Measurement;

  constructor(
    public readonly teeth: number,
    public readonly chainType: string,
  ) {
    super('SimpleSprocket');
    this.pitch =
      {
        '#25': new Measurement(0.25, 'in'),
        '#35': new Measurement(0.375, 'in'),
        '#40': new Measurement(0.5, 'in'),
      }[chainType] ?? new Measurement(0, 'in');

    this.pitchDiameter = this.pitch.mul(this.teeth).div(Math.PI);
  }

  public toDict(): Record<string, unknown> {
    return {
      teeth: this.teeth,
      chainType: this.chainType,
    };
  }

  eq<M extends Model>(_m: M): boolean {
    return false;
  }
}

export default class Sprocket extends SimpleSprocket {
  constructor(
    public readonly teeth: number,
    public readonly bore: Bore,
    public readonly chainType: string,
    public readonly url: string,
    public readonly sku: string | null,
    public readonly vendor: string,
  ) {
    super(teeth, chainType);
  }

  public static fromJson(json: JSONSprocket): Sprocket {
    return new Sprocket(
      json.teeth,
      json.bore,
      json.chainType,
      json.url,
      json.sku,
      json.vendor,
    );
  }

  public toDict(): Record<string, unknown> {
    return super.toDict();
  }

  eq<M extends Model>(_m: M): boolean {
    return false;
  }
}
