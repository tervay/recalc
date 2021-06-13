import Measurement from "common/models/Measurement";
import Model from "common/models/Model";
import keyBy from "lodash/keyBy";

export default class Filament extends Model {
  /**
   *
   * @param {string} name The brand name of the filament.
   */
  constructor(name) {
    super(name, filamentMap);
  }

  /**
   *
   * @returns {Filament[]} An array of all valid filaments.
   */
  static getAllFilaments() {
    return Object.keys(filamentMap).map((k) => new Filament(k));
  }
}

const filamentMap = keyBy(
  [
    {
      material: "Onyx",
      name: "Markforged Onyx",
      density: new Measurement(1.2, "g/cm3"),
      youngsModulus: new Measurement(1400, "MPa"),
      tensileStrength: new Measurement(30, "MPa"),
      bendingStrength: new Measurement(81, "MPa"),
      charpy: new Measurement(10.72, "kJ/m2"),
      sources: [
        "http://static.markforged.com/downloads/composites-data-sheet.pdf",
        "https://scholarworks.rit.edu/cgi/viewcontent.cgi?article=11338&context=theses",
        "https://www.matec-conferences.org/articles/matecconf/pdf/2019/03/matecconf_mms18_01018.pdf",
      ],
    },
    {
      material: "PLA",
      name: "Prusament PLA",
      density: new Measurement(1.24, "g/cm3"),
      youngsModulus: new Measurement(2200, "MPa"),
      tensileStrength: new Measurement(50.8, "MPa"),
      bendingStrength: null,
      charpy: new Measurement(12.7, "kJ/m^2"),
      sources: ["https://shop.prusa3d.com/fotky/PLA_TechSheet_ENG.pdf"],
    },
    {
      material: "Polycarb",
      name: "Prusament PC Blend",
      density: new Measurement(1.22, "g/cm3"),
      youngsModulus: new Measurement(1900, "MPa"),
      tensileStrength: new Measurement(63, "MPa"),
      bendingStrength: new Measurement(88, "MPa"),
      charpy: null,
      sources: [
        "https://prusament.com/media/2018/09/PCBLEND_TechSheet_ENG.pdf",
      ],
    },
    {
      material: "PETG",
      name: "Prusament PETG",
      density: new Measurement(1.27, "g/cm3"),
      youngsModulus: new Measurement(1500, "MPa"),
      tensileStrength: new Measurement(47, "MPa"),
      bendingStrength: null,
      charpy: null,
      sources: ["https://prusament.com/media/2020/01/PETG_TechSheet_ENG.pdf"],
    },
    {
      material: "PVB",
      name: "Prusament PVB",
      density: new Measurement(1.09, "g/cm3"),
      youngsModulus: new Measurement(1600, "MPa"),
      tensileStrength: new Measurement(50, "MPa"),
      bendingStrength: new Measurement(72, "MPa"),
      charpy: new Measurement(55, "kJ/m2"),
      sources: ["https://prusament.com/media/2021/01/PVB-TDS-EN.pdf"],
    },
    {
      material: "ASA",
      name: "Prusament ASA",
      density: new Measurement(1.07, "g/cm3"),
      youngsModulus: new Measurement(1700, "MPa"),
      tensileStrength: new Measurement(42, "MPa"),
      bendingStrength: new Measurement(64, "MPa"),
      charpy: new Measurement(25, "kJ/m2"),
      sources: ["https://prusament.com/media/2018/09/ASA_DataSheet_ENG.pdf"],
    },
    {
      material: "PC+CF",
      name: "Prusament PC Blend Carbon Fiber",
      density: new Measurement(1.16, "g/cm3"),
      youngsModulus: new Measurement(2300, "MPa"),
      tensileStrength: new Measurement(55, "MPa"),
      bendingStrength: new Measurement(85, "MPa"),
      charpy: new Measurement(30, "kJ/m2"),
      sources: ["https://prusament.com/media/2021/06/PCB_CF_TDS_EN.pdf"],
    },
    {
      material: "PLA",
      name: "PolyLite PLA",
      density: new Measurement(1.2, "g/cm3"),
      youngsModulus: new Measurement(2636, "MPa"),
      tensileStrength: new Measurement(46.6, "MPa"),
      bendingStrength: new Measurement(85.1, "MPa"),
      charpy: new Measurement(2.68, "kJ/m^2"),
      sources: [
        "https://us.polymaker.com/Downloads/TDS/PolyLite%20PLA_TDS_V5.pdf",
      ],
    },
    {
      material: "PLA+",
      name: "PolyMax PLA",
      density: new Measurement(1.2, "g/cm3"),
      youngsModulus: new Measurement(1879, "MPa"),
      tensileStrength: new Measurement(28.1, "MPa"),
      bendingStrength: new Measurement(48, "MPa"),
      charpy: new Measurement(12.1, "kJ/m^2"),
      sources: [
        "https://us.polymaker.com/Downloads/TDS/PolyMax%20PLA_TDS_V5.pdf",
      ],
    },
    {
      material: "ABS",
      name: "PolyLite ABS",
      density: new Measurement(1.12, "g/cm3"),
      youngsModulus: new Measurement(2174, "MPa"),
      tensileStrength: new Measurement(33.3, "MPa"),
      bendingStrength: new Measurement(72.8, "MPa"),
      charpy: new Measurement(12.6, "kJ/m^2"),
      sources: [
        "https://us.polymaker.com/Downloads/TDS/PolyLite_ABS_TDS_V5.pdf",
      ],
    },
    {
      material: "ASA",
      name: "PolyLite ASA",
      density: new Measurement(1.1, "g/cm3"),
      youngsModulus: new Measurement(2379, "MPa"),
      tensileStrength: new Measurement(43.8, "MPa"),
      bendingStrength: new Measurement(73.4, "MPa"),
      charpy: new Measurement(10.3, "kJ/m^2"),
      sources: ["https://polymaker.com/Downloads/TDS/PolyLite_ASA_TDS_V5.pdf"],
    },
    {
      material: "PETG",
      name: "PolyLite PETG",
      density: new Measurement(1.25, "g/cm3"),
      youngsModulus: new Measurement(1472, "MPa"),
      tensileStrength: new Measurement(31.9, "MPa"),
      bendingStrength: new Measurement(53.7, "MPa"),
      charpy: new Measurement(5.1, "kJ/m^2"),
      sources: [
        "https://us.polymaker.com/Downloads/TDS/PolyLite_PETG_TDS_V5.pdf",
      ],
    },
    {
      material: "PETG+",
      name: "PolyMax PETG",
      density: new Measurement(1.25, "g/cm3"),
      youngsModulus: new Measurement(1523, "MPa"),
      tensileStrength: new Measurement(31.7, "MPa"),
      bendingStrength: new Measurement(58.3, "MPa"),
      charpy: new Measurement(9.7, "kJ/m^2"),
      sources: [
        "https://us.polymaker.com/Downloads/TDS/PolyMax_PETG_TDS_V5.pdf",
      ],
    },
    {
      material: "Polycarb",
      name: "PolyLite PC",
      density: new Measurement(1.19, "g/cm3"),
      youngsModulus: new Measurement(2307, "MPa"),
      tensileStrength: new Measurement(62.7, "MPa"),
      bendingStrength: new Measurement(100.4, "MPa"),
      charpy: new Measurement(3.41, "kJ/m^2"),
      sources: [
        "https://us.polymaker.com/Downloads/TDS/PolyLite_PC_TDS_V5.pdf",
      ],
    },
    {
      material: "Polycarb",
      name: "PolyMax PC",
      density: new Measurement(1.19, "g/cm3"),
      youngsModulus: new Measurement(2048, "MPa"),
      tensileStrength: new Measurement(59.7, "MPa"),
      bendingStrength: new Measurement(94.1, "MPa"),
      charpy: new Measurement(25.1, "kJ/m^2"),
      sources: ["https://us.polymaker.com/Downloads/TDS/PolyMax_PC_TDS_V5.pdf"],
    },
  ],
  "name"
);
