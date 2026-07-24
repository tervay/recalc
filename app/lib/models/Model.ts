export default abstract class Model {
  constructor(public readonly identifier: string) {}

  abstract toDict(): Record<string, unknown>;
  abstract eq(m: Model): boolean;
}
