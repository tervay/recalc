export default class RecalcError extends Error {
  constructor(message) {
    super(message);
    this.name = "RecalcError";
  }
}

export class NotImplementedError extends RecalcError {
  constructor(message) {
    super(message);
    this.name = "NotImplementedError";
  }
}
