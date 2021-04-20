import Model from "common/models/Model";

class InvalidModel extends Model {
  constructor() {
    super();
  }
}

describe("Model", () => {
  describe("Invalid model", () => {
    test("fails on toDict()", () => {
      expect(() => new InvalidModel().toDict()).toThrow(
        "All models must implement toDict!"
      );
    });

    test("fails on fromDict()", () => {
      expect(() => InvalidModel.fromDict({})).toThrow(
        "All models must implement fromDict!"
      );
    });

    test("fails on getParam.encode", () => {
      const p = InvalidModel.getParam();

      expect(() => p.encode(new InvalidModel())).toThrow(
        "All models must implement toDict!"
      );
    });

    test("fails on getParam.decode", () => {
      const p = InvalidModel.getParam();

      expect(() => p.decode({})).toThrow("All models must implement fromDict!");
    });
  });

  describe("Valid model", () => {
    const toDictFn = jest.fn((m) => ({ a: m.a, b: m.b }));
    const fromDictFn = jest.fn((obj) => new ValidModel(obj.a, obj.b));

    class ValidModel extends Model {
      constructor(a, b) {
        super();
        this.a = a;
        this.b = b;
      }
      toDict() {
        return toDictFn(this);
      }

      static fromDict(obj) {
        return fromDictFn(obj);
      }
    }

    test("toDict works correctly", () => {
      const model = new ValidModel(5, 6);
      const retDict = model.toDict();
      expect(retDict).toEqual({ a: 5, b: 6 });
      expect(toDictFn.mock.calls).toHaveLength(1);
    });

    test("fromDict works correctly", () => {
      const dict = { a: 1, b: 2 };
      const model = ValidModel.fromDict(dict);
      expect(model.a).toEqual(1);
      expect(model.b).toEqual(2);
      expect(fromDictFn.mock.calls).toHaveLength(1);
    });
  });
});
