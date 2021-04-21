import Model from "common/models/Model";
import keyBy from "lodash/keyBy";

import Measurement from "./Measurement";

export default class Material extends Model {
  constructor(name) {
    super(name, materialMap);
  }

  toDict() {
    return {
      name: this.name,
    };
  }

  static fromDict(dict) {
    return new Material(dict.name);
  }

  getSafeMaterialStrength() {
    return this.tensileStrength.div(3);
  }

  static Steel4140Annealed() {
    return new Material("4140 Steel Annealed");
  }

  static Aluminum7075_T6() {
    return new Material("7075-T6 Aluminum");
  }

  static getAllMaterials() {
    return Object.keys(materialMap).map((m) => new Material(m));
  }
}

const psi = (n) => new Measurement(n, "psi");
export const materialMap = keyBy(
  [
    { name: "1020 Steel", tensileStrength: psi(65000) },
    { name: "1040 Steel", tensileStrength: psi(90000) },
    { name: "1080 Steel", tensileStrength: psi(140000) },
    { name: "12L14 Steel", tensileStrength: psi(60000) },
    { name: "4130 Steel", tensileStrength: psi(97000) },
    { name: "4140 Steel Annealed", tensileStrength: psi(98000) },
    { name: "4140 Steel Hardened", tensileStrength: psi(156000) },
    { name: "Titanium 6AL4V", tensileStrength: psi(130000) },
    { name: "303 Stainless Steel", tensileStrength: psi(90000) },
    { name: "5052-H32 Aluminum", tensileStrength: psi(33000) },
    { name: "6061-T6 Aluminum", tensileStrength: psi(45000) },
    { name: "2024-T361 Aluminum", tensileStrength: psi(72000) },
    { name: "7075-T6 Aluminum", tensileStrength: psi(76000) },
    { name: "Yellow Brass", tensileStrength: psi(71000) },
    { name: "Polycarbonate", tensileStrength: psi(10500) },
    { name: "Delrin", tensileStrength: psi(10000) },
    { name: "Nylon", tensileStrength: psi(11500) },
    { name: "PVC", tensileStrength: psi(7000) },
    { name: "UHMW", tensileStrength: psi(4000) },
  ],
  "name"
);
