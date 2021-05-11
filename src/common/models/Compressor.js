import Measurement from "common/models/Measurement";
import Model from "common/models/Model";
import keyBy from "lodash/keyBy";
import { getCompressorWork } from "web/calculators/pneumatics/math";

export default class Compressor extends Model {
  /**
   *
   * @param {string} name The brand name of the compressor.
   */
  constructor(name) {
    super(name, compressorMap);
  }

  timeToFillmLToPSI(mL, psi) {
    let currentPsi = new Measurement(0, "psi");
    let currentTime = new Measurement(0, "s");
    const timeIncrement = new Measurement(1, "s");

    while (currentPsi.lte(psi)) {
      const compressorWork = getCompressorWork(
        this,
        currentPsi,
        timeIncrement,
        true
      );
      const pressureDelta = compressorWork.div(mL);
      currentPsi = currentPsi.add(pressureDelta);
      currentTime = currentTime.add(timeIncrement);
    }

    return currentTime;
  }

  toDict() {
    return {
      name: this.name,
    };
  }

  static fromDict(dict) {
    return new Compressor(dict.name);
  }

  static getAllCompressors() {
    return Object.keys(compressorMap).map((n) => new Compressor(n));
  }

  static VIAIR_90C_13_8V() {
    return new Compressor("VIAIR 90C (13.8v)");
  }

  static VIAIR_90C_12V() {
    return new Compressor("VIAIR 90C (12v)");
  }

  static VIAIR_250C_IG_13_8V() {
    return new Compressor("VIAIR 250C-IG (13.8v)");
  }

  static VIAIR_330C_IG_13_8V() {
    return new Compressor("VIAIR 330C-IG (13.8v)");
  }

  static THOMAS_215_12V() {
    return new Compressor("Thomas 215 (12v)");
  }

  static THOMAS_405_12V() {
    return new Compressor("Thomas 405 (12v)");
  }

  static ANDYMARK_1_1_PUMP_12V() {
    return new Compressor("AndyMark 1.1 Pump (12v)");
  }

  static CP26() {
    return new Compressor("CP26 (12v)");
  }
}

// https://arachnoid.com/polysolve/
const compressorMap = keyBy(
  [
    {
      name: "VIAIR 90C (13.8v)",
      polynomialTerms: [
        1.028775899000915, -5.7527883797306306e-2, 3.6049441268615982e-3,
        -1.1579457725774831e-4, 2.0024145929042497e-6, -1.9127106949542731e-8,
        9.5115238899234617e-11, -1.9226989003510868e-13,
      ],
      weight: new Measurement(2.4, "lb"),
      url: "https://www.viaircorp.com/c-models/90c",
    },
    {
      name: "VIAIR 90C (12v)",
      polynomialTerms: [
        8.8001641245124484e-1, -9.2561708953846578e-2, 9.3363727966984424e-3,
        -5.3475924547875537e-4, 1.7900877917868134e-5, -3.6803453142496926e-7,
        4.7202652228560132e-9, -3.6819367698723339e-11, 1.5971519675914118e-13,
        -2.9523135523161451e-16,
      ],
      weight: new Measurement(2.4, "lb"),
      url: "https://www.andymark.com/products/air-compressor",
    },
    {
      name: "VIAIR 250C-IG (13.8v)",
      polynomialTerms: [
        8.7851258587447223e-1, -7.7771400516363351e-3, 2.156877989213954e-4,
        -6.5489638941219998e-6, 1.0439398798015048e-7, -8.8858794462022626e-10,
        3.8667910589819109e-12, -6.7837971389097611e-15,
      ],
      weight: new Measurement(6.75, "lb"),
      url: "https://www.viaircorp.com/ig-series/250c-ig",
    },
    {
      name: "VIAIR 330C-IG (13.8v)",
      polynomialTerms: [
        1.0603349164862783, -8.5804324746025082e-4, -9.2961664827623746e-4,
        5.1060182930086459e-5, -1.4878766864032407e-6, 2.5796023536549022e-8,
        -2.6946319395156391e-10, 1.6542383679978623e-12, -5.483826112406666e-15,
        7.565053407050096e-18,
      ],
      weight: new Measurement(8.25, "lb"),
      url: "https://www.viaircorp.com/ig-series/330c-ig",
    },
    {
      name: "Thomas 215 (12v)",
      polynomialTerms: [
        9.7201595617973491e-1, -1.1502357703902167e-2, 6.8266386146313709e-5,
        -1.1947785176426372e-6, 2.93753803650021e-8, -2.8965229804550191e-10,
        9.4599243172975252e-13,
      ],
      weight: new Measurement(3, "lb"),
      url: "https://www.gardnerdenver.com/en-us/thomas/wob-l-piston-pumps-compressors/215-series",
    },
    {
      name: "Thomas 405 (12v)",
      polynomialTerms: [
        7.9156519950759152e-1, -1.2850558757606143e-2, 1.3409368118814985e-3,
        -6.6177541835089058e-5, 1.318724862014595e-6, -1.1603506789785263e-8,
        3.7663398701015387e-11,
      ],
      weight: new Measurement(4.3, "lb"),
      url: "https://www.gardnerdenver.com/en-us/thomas/wob-l-piston-pumps-compressors/405-series",
    },
    {
      name: "AndyMark 1.1 Pump (12v)",
      polynomialTerms: [
        1.1000553758298031, -1.0218124342727576e-1, 8.9377010396103421e-3,
        -4.1742350856808071e-4, 1.1094416662472634e-5, -1.7482118449944467e-7,
        1.6146153863887738e-9, -8.0610818682159146e-12, 1.6773769109154779e-14,
      ],
      weight: new Measurement(3.37, "lb"),
      url: "https://www.andymark.com/products/1-1-pump-12v",
    },
    {
      name: "CP26 (12v)",
      polynomialTerms: [
        9.2000000009785154e-1, -1.6195243167434085e-2, -1.1275301161506545e-3,
        8.1419712526638522e-5, -2.1104241746372474e-6, 2.7078174716511402e-8,
        -1.7253457457816692e-10, 4.3547341530076844e-13,
      ],
      weight: new Measurement(5.8, "lb"),
      url: "https://partstospray.com/cp26forroboticsmax092cfmmax130psi.aspx",
    },
  ].map((c) => ({
    ...c,
    cfmFn: (p) => {
      const pressureScalar = p.to("psi").scalar;
      const scalar = c.polynomialTerms.reduce(
        (prev, curr, i) => prev + curr * Math.pow(pressureScalar, i)
      );
      return new Measurement(scalar, "ft^3/min");
    },
  })),
  "name"
);
