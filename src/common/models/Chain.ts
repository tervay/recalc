import Measurement from "common/models/Measurement";
import Model from "common/models/Model";
import { isEqual } from "lodash";

export type ChainDict = {
  name: string;
};

export const chainPitchMap: Record<string, Measurement> = {
  "#25": new Measurement(0.25, "in"),
  "#35": new Measurement(0.375, "in"),
  "#40": new Measurement(0.5, "in"),
};

export default class Chain extends Model {
  public readonly pitch: Measurement;

  constructor(identifier: string) {
    super(identifier);
    if (!(identifier in chainPitchMap)) {
      throw Error(`Could not load pitch from id = "${identifier}"`);
    }

    this.pitch = chainPitchMap[identifier];
  }

  toDict(): ChainDict {
    return {
      name: this.identifier,
    };
  }

  chainType(): string {
    return this.identifier;
  }

  static fromDict(d: ChainDict): Chain {
    return new Chain(d.name);
  }

  eq<M extends Model>(m: M): boolean {
    return m instanceof Chain && isEqual(this.toDict(), m.toDict());
  }

  static getAllChoices(): string[] {
    return Object.keys(chainPitchMap);
  }
}
