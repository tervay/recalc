import Model from "common/models/Model";
import Piston, { PistonDict } from "common/models/Piston";
import { isEqual } from "lodash";

export type PistonListDict = {
  readonly pistons: PistonDict[];
};

export function getNumberFromPistonName(name: string): number {
  return Number(name.split(" ").pop());
}

export default class PistonList extends Model {
  constructor(public readonly pistons: Piston[]) {
    super("PistonList");
  }

  sort(): PistonList {
    return new PistonList(
      [...this.pistons].sort(
        (p, p2) =>
          getNumberFromPistonName(p.identifier) -
          getNumberFromPistonName(p2.identifier)
      )
    );
  }

  toDict(): PistonListDict {
    return {
      pistons: this.pistons.map((p) => p.toDict()),
    };
  }

  eq<M extends Model>(m: M): boolean {
    return m instanceof PistonList && isEqual(this.toDict(), m.toDict());
  }

  static fromDict(d: PistonListDict): PistonList {
    return new PistonList(d.pistons.map((pd) => Piston.fromDict(pd)));
  }

  copyAndAdd(p: Piston): PistonList {
    return new PistonList([...this.pistons, p]);
  }

  copyAndRemove(toRemove: Piston): PistonList {
    return new PistonList([...this.pistons.filter((p) => !p.eq(toRemove))]);
  }

  replaceInSameSpot(oldPiston: Piston, newPiston: Piston): PistonList {
    for (let i = 0; i < this.pistons.length; i++) {
      if (this.pistons[i].eq(oldPiston)) {
        return new PistonList([
          ...this.pistons.slice(0, i),
          newPiston,
          ...this.pistons.slice(i + 1),
        ]);
      }
    }

    return this;
  }
}
