import { NotImplementedError } from "common/tooling/errors";
import { decodeJson, encodeJson } from "use-query-params";

export default class Model {
  constructor(name, dataMap) {
    if (name !== undefined && dataMap !== undefined) {
      this.name = name;
      const data = dataMap[name];
      Object.entries(data).forEach(([k, v]) => {
        this[k] = v;
      });
    }
  }

  toDict() {
    throw new NotImplementedError("All models must implement toDict!");
  }

  static fromDict() {
    throw new NotImplementedError("All models must implement fromDict!");
  }

  /**
   *
   * @returns {{encode: (function(Model): string), decode: (function(string): Model)}}
   */
  static getParam() {
    return {
      encode: (model) => encodeJson(model.toDict()),
      decode: (string) => this.fromDict(decodeJson(string)),
    };
  }
}
