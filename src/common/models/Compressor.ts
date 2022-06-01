import _rawCommpressorData from "common/models/data/compressors.json";
import Measurement, { RawMeasurementJson } from "common/models/Measurement";
import Model from "common/models/Model";
import { isEqual, keyBy } from "lodash";

type RawCompressorSpec = {
  readonly name: string;
  readonly cfmPolynomialTerms: number[];
  readonly weight: RawMeasurementJson;
  readonly url: string;
};

const rawCompressorDataLookup: Record<string, RawCompressorSpec> = keyBy(
  _rawCommpressorData,
  "name"
);

export type CompressorDict = {
  readonly name: string;
};

export const DISABLE_AT_PSI = new Measurement(120, "psi");
export const ENABLE_AT_PSI = new Measurement(95, "psi");

export default class Compressor extends Model {
  private readonly cachedCfmFn: (_pressure: Measurement) => Measurement;

  constructor(
    identifier: string,
    private readonly cfmPolynomialTerms: number[],
    public readonly weight: Measurement,
    public readonly url: string
  ) {
    super(identifier);

    this.cachedCfmFn = (pressure: Measurement) => {
      const pressureScalar = pressure.to("psi").scalar;
      const scalar = this.cfmPolynomialTerms.reduce(
        (prev, curr, i) => prev + curr * Math.pow(pressureScalar, i)
      );
      return new Measurement(scalar, "ft^3/min");
    };
  }

  cfmAtPressure(pressure: Measurement): Measurement {
    return this.cachedCfmFn(pressure);
  }

  getWork(pressure: Measurement, dt: Measurement): Measurement {
    return this.cfmAtPressure(pressure).mul(new Measurement(1, "atm")).mul(dt);
  }

  static fromIdentifier(id: string): Compressor {
    return new Compressor(
      id,
      rawCompressorDataLookup[id].cfmPolynomialTerms,
      Measurement.fromRawJson(rawCompressorDataLookup[id].weight),
      rawCompressorDataLookup[id].url
    );
  }

  static getAllCompressors(): Compressor[] {
    return Object.keys(rawCompressorDataLookup).map((s) =>
      this.fromIdentifier(s)
    );
  }

  static getAllChoices(): string[] {
    return Object.keys(rawCompressorDataLookup);
  }

  toDict(): CompressorDict {
    return {
      name: this.identifier,
    };
  }

  static fromDict(d: CompressorDict): Compressor {
    return Compressor.fromIdentifier(d.name);
  }

  eq<M extends Model>(m: M): boolean {
    return m instanceof Compressor && isEqual(this.toDict(), m.toDict());
  }

  static VIAIR_90C_12V(): Compressor {
    return Compressor.fromIdentifier("VIAIR 90C (12V)");
  }

  static VIAIR_90C_13V(): Compressor {
    return Compressor.fromIdentifier("VIAIR 90C (13.8V)");
  }

  static ANDYMARK_11(): Compressor {
    return Compressor.fromIdentifier("AndyMark 1.1 Pump (12V)");
  }
}
