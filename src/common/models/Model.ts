export default abstract class Model {
  public readonly identifier: string;

  constructor(identifier: string) {
    this.identifier = identifier;
  }

  abstract toDict(): Record<string, unknown>;
  abstract eq<M extends Model>(m: M): boolean;
}
