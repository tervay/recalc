import Qty from "js-quantities";
import keyBy from "lodash/keyBy";

export default class Filament {
  constructor(name, data) {
    this.name = name;

    data = data || filamentMap[name];
    this.material = data.material;
    this.density = data.density;
    this.youngsModulus = data.youngsModulus;
    this.tensileStrength = data.tensileStrength;
    this.bendingStrength = data.bendingStrength;
    this.charpy = data.charpy;
    this.sources = data.sources;
  }

  static getAllFilaments() {
    return Object.keys(filamentMap).map((k) => new Filament(k));
  }
}

const filamentMap = keyBy(
  [
    {
      material: "Onyx",
      name: "Markforged Onyx",
      density: Qty(1.2, "g/cm3"),
      youngsModulus: Qty(1400, "MPa"),
      tensileStrength: Qty(30, "MPa"),
      bendingStrength: Qty(81, "MPa"),
      charpy: Qty(10.72, "kJ/m2"),
      sources: [
        "https://static.markforged.com/markforged_composites_datasheet.pdf",
        "https://scholarworks.rit.edu/cgi/viewcontent.cgi?article=11338&context=theses",
        "https://www.matec-conferences.org/articles/matecconf/pdf/2019/03/matecconf_mms18_01018.pdf",
      ],
    },
    {
      material: "PLA",
      name: "Prusa PLA",
      density: Qty(1.24, "g/cm3"),
      youngsModulus: Qty(2200, "MPa"),
      tensileStrength: Qty(50.8, "MPa"),
      bendingStrength: null,
      charpy: Qty(12.7, "kJ/m^2"),
      sources: ["https://shop.prusa3d.com/fotky/PLA_TechSheet_ENG.pdf"],
    },
    {
      material: "PLA",
      name: "PolyLite PLA",
      density: Qty(1.2, "g/cm3"),
      youngsModulus: Qty(2636, "MPa"),
      tensileStrength: Qty(46.6, "MPa"),
      bendingStrength: Qty(85.1, "MPa"),
      charpy: Qty(2.7, "kJ/m^2"),
      sources: [
        "https://us.polymaker.com/Downloads/TDS/PolyLite_PLA_TDS_V4.pdf",
      ],
    },
    {
      material: "PLA+",
      name: "PolyMax PLA",
      density: Qty(1.2, "g/cm3"),
      youngsModulus: Qty(1879, "MPa"),
      tensileStrength: Qty(28.1, "MPa"),
      bendingStrength: Qty(48, "MPa"),
      charpy: Qty(12.2, "kJ/m^2"),
      sources: [
        "https://us.polymaker.com/Downloads/TDS/PolyMax_PLA_TDS_V4.pdf",
      ],
    },
    {
      material: "ABS",
      name: "PolyLite ABS",
      density: Qty(1.12, "g/cm3"),
      youngsModulus: Qty(2174, "MPa"),
      tensileStrength: Qty(33.3, "MPa"),
      bendingStrength: Qty(59, "MPa"),
      charpy: Qty(12.6, "kJ/m^2"),
      sources: [
        "https://us.polymaker.com/Downloads/TDS/PolyLite_ABS_TDS_V4.pdf",
      ],
    },
    {
      material: "ASA",
      name: "PolyLite ASA",
      density: Qty(1.1, "g/cm3"),
      youngsModulus: Qty(2379, "MPa"),
      tensileStrength: Qty(43.8, "MPa"),
      bendingStrength: Qty(73.4, "MPa"),
      charpy: Qty(10.3, "kJ/m^2"),
      sources: [
        "https://polymaker.com/Downloads/TDS/PolyLite_ASA_TDS_V4.1.pdf",
      ],
    },
    {
      material: "PETG",
      name: "PolyLite PETG",
      density: Qty(1.25, "g/cm3"),
      youngsModulus: Qty(1472, "MPa"),
      tensileStrength: Qty(31.9, "MPa"),
      bendingStrength: Qty(53.7, "MPa"),
      charpy: Qty(5.1, "kJ/m^2"),
      sources: [
        "https://us.polymaker.com/Downloads/TDS/PolyLite_PETG_TDS_V4.pdf",
      ],
    },
    {
      material: "PETG+",
      name: "PolyMax PETG",
      density: Qty(1.25, "g/cm3"),
      youngsModulus: Qty(1523, "MPa"),
      tensileStrength: Qty(31.7, "MPa"),
      bendingStrength: Qty(58.3, "MPa"),
      charpy: Qty(9.7, "kJ/m^2"),
      sources: [
        "https://us.polymaker.com/Downloads/TDS/PolyMax_PETG_TDS_V4.pdf",
      ],
    },
    {
      material: "Polycarb",
      name: "PolyLite PC",
      density: Qty(1.19, "g/cm3"),
      youngsModulus: Qty(2307, "MPa"),
      tensileStrength: Qty(62.7, "MPa"),
      bendingStrength: Qty(100.4, "MPa"),
      charpy: Qty(3.4, "kJ/m^2"),
      sources: [
        "https://us.polymaker.com/Downloads/TDS/PolyLite_PC_TDS_V4.pdf",
      ],
    },
    {
      material: "Polycarb",
      name: "PolyMax PC",
      density: Qty(1.19, "g/cm3"),
      youngsModulus: Qty(2048, "MPa"),
      tensileStrength: Qty(59.7, "MPa"),
      bendingStrength: Qty(94.1, "MPa"),
      charpy: Qty(25.1, "kJ/m^2"),
      sources: ["https://us.polymaker.com/Downloads/TDS/PolyMax_PC_TDS_V4.pdf"],
    },
  ],
  "name"
);
