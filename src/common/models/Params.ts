import Chain, { ChainDict } from "common/models/Chain";
import Compressor, { CompressorDict } from "common/models/Compressor";
import { Bore } from "common/models/ExtraTypes";
import Measurement, { MeasurementDict } from "common/models/Measurement";
import Motor, { MotorDict } from "common/models/Motor";
import MotorPlaygroundList, {
  MotorPlaygroundListDict,
} from "common/models/MotorPlaygroundList";
import PistonList, { PistonListDict } from "common/models/PistonList";
import Pulley, { PulleyDict } from "common/models/Pulley";
import Ratio, { RatioDict } from "common/models/Ratio";
import RatioPairList, { RatioPairDict } from "common/models/RatioPair";
import {
  decodeJson,
  decodeString,
  encodeJson,
  encodeString,
} from "use-query-params";

export type ParamValue = number | Motor | Measurement | Pulley;

type DecodableString = string | (string | null)[] | null | undefined;

export const MotorParam = {
  encode: (m: Motor): DecodableString => {
    return encodeJson(m.toDict());
  },
  decode: (s: DecodableString): Motor | null => {
    if (s === null || s === undefined) {
      return null;
    }

    if (typeof s === "string" && s.includes("*")) {
      s = s.replace(/\*/g, "");
    }

    return Motor.fromDict(decodeJson(s) as MotorDict);
  },
};

export const RatioParam = {
  encode: (r: Ratio): DecodableString => {
    return encodeJson(r.toDict());
  },
  decode: (s: DecodableString): Ratio | null => {
    if (s === null || s === undefined) {
      return null;
    }

    return Ratio.fromDict(decodeJson(s) as RatioDict);
  },
};

export const RatioPairParam = {
  encode: (r: RatioPairList): DecodableString => {
    return encodeJson(r.toDict());
  },
  decode: (s: DecodableString): RatioPairList | null => {
    if (s === null || s === undefined) {
      return null;
    }

    return RatioPairList.fromDict(decodeJson(s) as RatioPairDict);
  },
};

export const MeasurementParam = {
  encode: (m: Measurement): DecodableString => {
    return encodeJson(m.toDict());
  },
  decode: (s: DecodableString): Measurement | null => {
    if (s === null || s === undefined) {
      return null;
    }

    const obj = decodeJson(s) as Record<string, unknown>;
    obj["s"] = Number(obj["s"]);
    return Measurement.fromDict(obj as unknown as MeasurementDict);
  },
};

export const PulleyParam = {
  encode: (p: Pulley): DecodableString => {
    return encodeJson(p.toDict());
  },
  decode: (s: DecodableString): Pulley | null => {
    if (s === null || s === undefined) {
      return null;
    }

    const obj = decodeJson(s);
    return Pulley.fromDict(obj as PulleyDict);
  },
};

export const PistonListParam = {
  encode: (pl: PistonList): DecodableString => {
    return encodeJson(pl.toDict());
  },
  decode: (s: DecodableString): PistonList | null => {
    if (s === null || s === undefined) {
      return null;
    }

    return PistonList.fromDict(decodeJson(s) as PistonListDict);
  },
};

export const CompressorParam = {
  encode: (c: Compressor): DecodableString => {
    return encodeJson(c.toDict());
  },
  decode: (s: DecodableString): Compressor | null => {
    if (s === null || s === undefined) {
      return null;
    }

    return Compressor.fromDict(decodeJson(s) as CompressorDict);
  },
};

export const ChainParam = {
  encode: (c: Chain): DecodableString => {
    return encodeJson(c.toDict());
  },
  decode: (s: DecodableString): Chain | null => {
    if (s === null || s === undefined) {
      return null;
    }

    return Chain.fromDict(decodeJson(s) as ChainDict);
  },
};

export const BoreParam = {
  encode: (b: Bore): DecodableString => {
    return encodeString(b);
  },
  decode: (s: DecodableString): Bore => {
    if (s === null || s === undefined) {
      // i don't know why this breaks things if i set it to return a nullable
      return "NEO";
    }

    return decodeString(s) as Bore;
  },
};

export const MotorPlaygroundListParam = {
  encode: (mpl: MotorPlaygroundList): DecodableString => {
    return encodeJson(mpl.toDict());
  },
  decode: (s: DecodableString): MotorPlaygroundList | null => {
    if (s === null || s === undefined) {
      return null;
    }

    return MotorPlaygroundList.fromDict(
      decodeJson(s) as MotorPlaygroundListDict,
    );
  },
};

export const TypeParamMap = {
  Motor: MotorParam,
  Measurement: MeasurementParam,
  Compressor: CompressorParam,
  PistonList: PistonListParam,
  Ratio: RatioParam,
  Pulley: PulleyParam,
  MotorPlaygroundList: MotorPlaygroundListParam,
  Bore: BoreParam,
};
