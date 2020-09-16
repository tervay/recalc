import Qty from "common/models/Qty";
import Model from "common/tooling/abc/Model";
import keyBy from "lodash/keyBy";

export default class Filament extends Model {
  constructor(name) {
    super(name, filamentMap);
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
      density: new Qty(1.2, "g/cm3"),
      youngsModulus: new Qty(1400, "MPa"),
      tensileStrength: new Qty(30, "MPa"),
      bendingStrength: new Qty(81, "MPa"),
      charpy: new Qty(10.72, "kJ/m2"),
      sources: [
        "https://static.markforged.com/markforged_composites_datasheet.pdf",
        "https://scholarworks.rit.edu/cgi/viewcontent.cgi?article=11338&context=theses",
        "https://www.matec-conferences.org/articles/matecconf/pdf/2019/03/matecconf_mms18_01018.pdf",
      ],
    },
    {
      material: "PLA",
      name: "Prusa PLA",
      density: new Qty(1.24, "g/cm3"),
      youngsModulus: new Qty(2200, "MPa"),
      tensileStrength: new Qty(50.8, "MPa"),
      bendingStrength: null,
      charpy: new Qty(12.7, "kJ/m^2"),
      sources: ["https://shop.prusa3d.com/fotky/PLA_TechSheet_ENG.pdf"],
    },
    {
      material: "PLA",
      name: "PolyLite PLA",
      density: new Qty(1.2, "g/cm3"),
      youngsModulus: new Qty(2636, "MPa"),
      tensileStrength: new Qty(46.6, "MPa"),
      bendingStrength: new Qty(85.1, "MPa"),
      charpy: new Qty(2.7, "kJ/m^2"),
      sources: [
        "https://us.polymaker.com/Downloads/TDS/PolyLite_PLA_TDS_V4.pdf",
      ],
    },
    {
      material: "PLA+",
      name: "PolyMax PLA",
      density: new Qty(1.2, "g/cm3"),
      youngsModulus: new Qty(1879, "MPa"),
      tensileStrength: new Qty(28.1, "MPa"),
      bendingStrength: new Qty(48, "MPa"),
      charpy: new Qty(12.2, "kJ/m^2"),
      sources: [
        "https://us.polymaker.com/Downloads/TDS/PolyMax_PLA_TDS_V4.pdf",
      ],
    },
    {
      material: "ABS",
      name: "PolyLite ABS",
      density: new Qty(1.12, "g/cm3"),
      youngsModulus: new Qty(2174, "MPa"),
      tensileStrength: new Qty(33.3, "MPa"),
      bendingStrength: new Qty(59, "MPa"),
      charpy: new Qty(12.6, "kJ/m^2"),
      sources: [
        "https://us.polymaker.com/Downloads/TDS/PolyLite_ABS_TDS_V4.pdf",
      ],
    },
    {
      material: "ASA",
      name: "PolyLite ASA",
      density: new Qty(1.1, "g/cm3"),
      youngsModulus: new Qty(2379, "MPa"),
      tensileStrength: new Qty(43.8, "MPa"),
      bendingStrength: new Qty(73.4, "MPa"),
      charpy: new Qty(10.3, "kJ/m^2"),
      sources: [
        "https://polymaker.com/Downloads/TDS/PolyLite_ASA_TDS_V4.1.pdf",
      ],
    },
    {
      material: "PETG",
      name: "PolyLite PETG",
      density: new Qty(1.25, "g/cm3"),
      youngsModulus: new Qty(1472, "MPa"),
      tensileStrength: new Qty(31.9, "MPa"),
      bendingStrength: new Qty(53.7, "MPa"),
      charpy: new Qty(5.1, "kJ/m^2"),
      sources: [
        "https://us.polymaker.com/Downloads/TDS/PolyLite_PETG_TDS_V4.pdf",
      ],
    },
    {
      material: "PETG+",
      name: "PolyMax PETG",
      density: new Qty(1.25, "g/cm3"),
      youngsModulus: new Qty(1523, "MPa"),
      tensileStrength: new Qty(31.7, "MPa"),
      bendingStrength: new Qty(58.3, "MPa"),
      charpy: new Qty(9.7, "kJ/m^2"),
      sources: [
        "https://us.polymaker.com/Downloads/TDS/PolyMax_PETG_TDS_V4.pdf",
      ],
    },
    {
      material: "Polycarb",
      name: "PolyLite PC",
      density: new Qty(1.19, "g/cm3"),
      youngsModulus: new Qty(2307, "MPa"),
      tensileStrength: new Qty(62.7, "MPa"),
      bendingStrength: new Qty(100.4, "MPa"),
      charpy: new Qty(3.4, "kJ/m^2"),
      sources: [
        "https://us.polymaker.com/Downloads/TDS/PolyLite_PC_TDS_V4.pdf",
      ],
    },
    {
      material: "Polycarb",
      name: "PolyMax PC",
      density: new Qty(1.19, "g/cm3"),
      youngsModulus: new Qty(2048, "MPa"),
      tensileStrength: new Qty(59.7, "MPa"),
      bendingStrength: new Qty(94.1, "MPa"),
      charpy: new Qty(25.1, "kJ/m^2"),
      sources: ["https://us.polymaker.com/Downloads/TDS/PolyMax_PC_TDS_V4.pdf"],
    },
  ],
  "name"
);
