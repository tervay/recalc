export class CustomSet<T> {
  constructor(
    private readonly eq: (a: T, b: T) => boolean,
    public set: T[],
  ) {}

  add(t: T) {
    if (this.set.filter((p) => this.eq(t, p)).length === 0) {
      this.set.push(t);
    }
  }

  bulkAdd(ts: T[]) {
    ts.forEach((t) => {
      this.add(t);
    });
  }
}
