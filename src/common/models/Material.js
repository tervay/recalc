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
    return [
      this.mechanical.tensileStrengthYield,
      this.mechanical.tensileStrengthUltimate,
      this.mechanical.tensileStrengthBreak,
    ]
      .find((v) => v !== undefined)
      .div(3);
  }

  static Steel4140() {
    return new Material("4140 Steel");
  }

  static Aluminum7075_T6() {
    return new Material("7075-T6 Aluminum");
  }

  static getAllMaterials() {
    return Object.keys(materialMap).map((m) => new Material(m));
  }
}

class MechanicalProperties {
  constructor({
    brinellHardness,
    rockwellMHardness,
    tensileModulus,
    tensileStrengthUltimate,
    tensileStrengthYield,
    tensileStrengthBreak,
    elongationAtBreak,
    fatigueStrength,
    poissonsRatio,
    shearModulus,
    shearStrength,
    density,
    flexuralModulus,
    flexuralStrength,
    impactNotchedIzod,
    impactCharpy,
  } = {}) {
    this.brinellHardness = brinellHardness;
    this.rockwellMHardness = rockwellMHardness;
    this.tensileModulus = tensileModulus;
    this.tensileStrengthUltimate = tensileStrengthUltimate;
    this.tensileStrengthYield = tensileStrengthYield;
    this.tensileStrengthBreak = tensileStrengthBreak;
    this.elongationAtBreak = elongationAtBreak;
    this.fatigueStrength = fatigueStrength;
    this.poissonsRatio = poissonsRatio;
    this.shearModulus = shearModulus;
    this.shearStrength = shearStrength;
    this.density = density;
    this.flexuralModulus = flexuralModulus;
    this.flexuralStrength = flexuralStrength;
    this.impactNotchedIzod = impactNotchedIzod;
    this.impactCharpy = impactCharpy;
  }
}

class ThermalProperties {
  constructor({
    latentHeatOfFusion,
    maximumTemperatureMechanical,
    meltingCompletion,
    meltingOnset,
    specificHeatCapacity,
    thermalConductivity,
    thermalExpansion,
    heatDeflectionAt66Psi,
    glassTransitionTemperature,
  } = {}) {
    this.latentHeatOfFusion = latentHeatOfFusion;
    this.maximumTemperatureMechanical = maximumTemperatureMechanical;
    this.meltingCompletion = meltingCompletion;
    this.meltingOnset = meltingOnset;
    this.specificHeatCapacity = specificHeatCapacity;
    this.thermalConductivity = thermalConductivity;
    this.thermalExpansion = thermalExpansion;
    this.heatDeflectionAt66Psi = heatDeflectionAt66Psi;
    this.glassTransitionTemperature = glassTransitionTemperature;
  }
}

const GPa = (n) => new Measurement(n, "GPa");
const MPa = (n) => new Measurement(n, "MPa");
const gcm3 = (n) => new Measurement(n, "g/cm3");
const Jg = (n) => new Measurement(n, "J/g");
const C = (n) => new Measurement(n, "celsius");
const JkgK = (n) =>
  new Measurement(n, "J ").div(new Measurement(1, "kg * degK"));
const WmK = (n) => new Measurement(n, "W").div(new Measurement(1, "m * degK"));
const ummK = (n) =>
  new Measurement(n, "micrometers").div(new Measurement(1, "m * degK"));
const Jm = (n) => new Measurement(n, "J/m");
const kJm2 = (n) => new Measurement(n, "kJ").div(new Measurement(1, "m^2"));

export const materialMap = keyBy(
  [
    {
      material: "Steel",
      name: "4130 Steel",
      mechanical: new MechanicalProperties({
        brinellHardness: 300,
        tensileModulus: GPa(190),
        elongationAtBreak: 18,
        fatigueStrength: MPa(660),
        poissonsRatio: 0.29,
        shearModulus: GPa(73),
        shearStrength: MPa(640),
        tensileStrengthUltimate: MPa(1040),
        tensileStrengthYield: MPa(980),
        density: gcm3(7.8),
      }),
      thermal: new ThermalProperties({
        latentHeatOfFusion: Jg(250),
        maximumTemperatureMechanical: C(420),
        meltingCompletion: C(1460),
        meltingOnset: C(1420),
        specificHeatCapacity: JkgK(470),
        thermalConductivity: WmK(43),
        thermalExpansion: ummK(13),
      }),
    },
    {
      material: "Steel",
      name: "4140 Steel",
      mechanical: new MechanicalProperties({
        brinellHardness: 310,
        tensileModulus: GPa(190),
        elongationAtBreak: 16,
        fatigueStrength: MPa(650),
        poissonsRatio: 0.29,
        shearModulus: GPa(73),
        shearStrength: MPa(660),
        tensileStrengthUltimate: MPa(1080),
        tensileStrengthYield: MPa(990),
        density: gcm3(7.8),
      }),
      thermal: new ThermalProperties({
        latentHeatOfFusion: Jg(250),
        maximumTemperatureMechanical: C(420),
        meltingCompletion: C(1460),
        meltingOnset: C(1420),
        specificHeatCapacity: JkgK(470),
        thermalConductivity: WmK(43),
        thermalExpansion: ummK(13),
      }),
    },
    {
      material: "Aluminum",
      name: "6061-T6 Aluminum",
      mechanical: new MechanicalProperties({
        brinellHardness: 93,
        tensileModulus: GPa(69),
        elongationAtBreak: 10,
        fatigueStrength: MPa(96),
        poissonsRatio: 0.33,
        shearModulus: GPa(26),
        shearStrength: MPa(210),
        tensileStrengthUltimate: MPa(310),
        tensileStrengthYield: MPa(270),
        density: gcm3(2.7),
      }),
      thermal: new ThermalProperties({
        latentHeatOfFusion: Jg(400),
        maximumTemperatureMechanical: C(170),
        meltingCompletion: C(650),
        meltingOnset: C(580),
        specificHeatCapacity: JkgK(900),
        thermalConductivity: WmK(170),
        thermalExpansion: ummK(24),
      }),
    },
    {
      material: "Aluminum",
      name: "7075-T6 Aluminum",
      mechanical: new MechanicalProperties({
        brinellHardness: 150,
        tensileModulus: GPa(70),
        elongationAtBreak: 7.9,
        fatigueStrength: MPa(160),
        poissonsRatio: 0.32,
        shearModulus: GPa(26),
        shearStrength: MPa(330),
        tensileStrengthUltimate: MPa(560),
        tensileStrengthYield: MPa(480),
        density: gcm3(3),
      }),
      thermal: new ThermalProperties({
        latentHeatOfFusion: Jg(380),
        maximumTemperatureMechanical: C(200),
        meltingCompletion: C(640),
        meltingOnset: C(480),
        specificHeatCapacity: JkgK(870),
        thermalConductivity: WmK(130),
        thermalExpansion: ummK(23),
      }),
    },
    {
      material: "Brass",
      name: "360 Brass",
      mechanical: new MechanicalProperties({
        tensileModulus: GPa(100),
        elongationAtBreak: 23,
        poissonsRatio: 0.31,
        shearModulus: GPa(39),
        shearStrength: MPa(210),
        tensileStrengthUltimate: MPa(330),
        tensileStrengthYield: MPa(140),
        density: gcm3(8.2),
      }),
      thermal: new ThermalProperties({
        latentHeatOfFusion: Jg(170),
        maximumTemperatureMechanical: C(120),
        meltingCompletion: C(900),
        meltingOnset: C(890),
        specificHeatCapacity: JkgK(380),
        thermalConductivity: WmK(120),
        thermalExpansion: ummK(21),
      }),
    },
    {
      name: "Generic PC",
      material: "Polycarb",
      mechanical: new MechanicalProperties({
        tensileModulus: GPa(2.3),
        elongationAtBreak: 110,
        fatigueStrength: MPa(6.9),
        flexuralModulus: GPa(2.3),
        flexuralStrength: MPa(92),
        impactNotchedIzod: Jm(440),
        poissonsRatio: 0.38,
        rockwellMHardness: 68,
        shearModulus: GPa(0.8),
        shearStrength: MPa(70),
        tensileStrengthUltimate: MPa(66),
        tensileStrengthYield: MPa(62),
        density: gcm3(1.2),
      }),
      thermal: new ThermalProperties({
        glassTransitionTemperature: C(150),
        heatDeflectionAt66Psi: C(140),
        maximumTemperatureMechanical: C(120),
        specificHeatCapacity: JkgK(1200),
        thermalConductivity: WmK(0.2),
        thermalExpansion: ummK(69),
      }),
    },
    {
      name: "Delrin",
      material: "POM-H",
      mechanical: new MechanicalProperties({
        tensileModulus: GPa(3.4),
        elongationAtBreak: 55,
        fatigueStrength: MPa(29),
        flexuralModulus: GPa(2.9),
        flexuralStrength: MPa(94),
        impactNotchedIzod: Jm(75),
        rockwellMHardness: 94,
        tensileStrengthUltimate: MPa(67),
        density: gcm3(1.4),
      }),
      thermal: new ThermalProperties({
        glassTransitionTemperature: C(-23),
        heatDeflectionAt66Psi: C(160),
        maximumTemperatureMechanical: C(90),
        meltingOnset: C(180),
        specificHeatCapacity: JkgK(1460),
        thermalConductivity: WmK(0.33),
        thermalExpansion: ummK(120),
      }),
    },
    {
      name: "Rigid PVC",
      material: "PVC",
      mechanical: new MechanicalProperties({
        tensileModulus: GPa(3.8),
        elongationAtBreak: 58,
        flexuralModulus: GPa(3.5),
        flexuralStrength: MPa(80),
        impactNotchedIzod: Jm(360),
        tensileStrengthUltimate: MPa(47),
        density: gcm3(1.4),
      }),
      thermal: new ThermalProperties({
        glassTransitionTemperature: C(85),
        heatDeflectionAt66Psi: C(90),
        maximumTemperatureMechanical: C(95),
        meltingOnset: C(180),
        specificHeatCapacity: JkgK(880),
        thermalConductivity: WmK(0.16),
        thermalExpansion: ummK(61),
      }),
    },
    {
      name: "HDPE",
      material: "HDPE",
      mechanical: new MechanicalProperties({
        tensileModulus: GPa(1.0),
        elongationAtBreak: 100,
        impactNotchedIzod: Jm(260),
        shearModulus: GPa(0.85),
        tensileStrengthUltimate: MPa(24),
        density: gcm3(1.0),
      }),
      thermal: new ThermalProperties({
        glassTransitionTemperature: C(-80),
        maximumTemperatureMechanical: C(90),
        meltingOnset: C(130),
        specificHeatCapacity: JkgK(2400),
        thermalConductivity: WmK(0.45),
        thermalExpansion: ummK(130),
      }),
    },
    {
      material: "PLA",
      name: "Generic PLA",
      mechanical: new MechanicalProperties({
        density: gcm3(1.3),
        tensileModulus: GPa(3.5),
        elongationAtBreak: 6.0,
        flexuralModulus: GPa(4.0),
        flexuralStrength: MPa(80),
        shearModulus: GPa(2.4),
        tensileStrengthUltimate: MPa(50),
      }),
      thermal: new ThermalProperties({
        specificHeatCapacity: JkgK(1800),
        thermalConductivity: WmK(0.13),
        maximumTemperatureMechanical: C(50),
        meltingOnset: C(160),
        heatDeflectionAt66Psi: C(65),
        glassTransitionTemperature: C(60),
      }),
    },
    {
      material: "PLA",
      name: "PolyLite PLA",
      mechanical: new MechanicalProperties({
        density: gcm3(1.17),
        tensileModulus: MPa(2636),
        tensileStrengthUltimate: MPa(46.6),
        elongationAtBreak: 1.9,
        flexuralModulus: MPa(3283),
        flexuralStrength: MPa(85.1),
        impactCharpy: kJm2(2.68),
      }),
      thermal: new ThermalProperties({
        glassTransitionTemperature: C(61),
        meltingOnset: C(150),
        heatDeflectionAt66Psi: C(59.8),
      }),
    },
    {
      material: "PETG",
      name: "Generic PETG",
      mechanical: new MechanicalProperties({
        tensileModulus: GPa(2.2),
        flexuralModulus: GPa(2.1),
        flexuralStrength: MPa(77),
        impactNotchedIzod: Jm(77),
        shearStrength: MPa(62),
        tensileStrengthUltimate: MPa(53),
        density: gcm3(1.3),
      }),
      thermal: new ThermalProperties({
        glassTransitionTemperature: C(81),
        heatDeflectionAt66Psi: C(73),
        meltingOnset: C(140),
        specificHeatCapacity: JkgK(1200),
        thermalConductivity: WmK(0.29),
        thermalExpansion: ummK(68),
      }),
    },
    {
      material: "ABS",
      name: "Generic ABS",
      mechanical: new MechanicalProperties({
        tensileModulus: GPa(2.0),
        elongationAtBreak: 20,
        flexuralModulus: GPa(2.1),
        flexuralStrength: MPa(97),
        impactNotchedIzod: Jm(320),
        poissonsRatio: 0.41,
        tensileStrengthUltimate: MPa(41),
        density: gcm3(1.1),
      }),
      thermal: new ThermalProperties({
        glassTransitionTemperature: C(100),
        heatDeflectionAt66Psi: C(100),
        maximumTemperatureMechanical: C(80),
        specificHeatCapacity: JkgK(1400),
        thermalConductivity: WmK(0.23),
        thermalExpansion: ummK(95),
      }),
    },
    {
      material: "CF-PC",
      name: "Prusament PC Blend Carbon Fiber",
      mechanical: new MechanicalProperties({
        density: gcm3(1.16),
        tensileStrengthYield: MPa(55),
        tensileModulus: GPa(2.3),
        flexuralModulus: GPa(3.0),
        flexuralStrength: MPa(85),
        impactCharpy: kJm2(9),
      }),
      thermal: new ThermalProperties({
        heatDeflectionAt66Psi: C(114),
      }),
    },
    {
      material: "Nylon",
      name: "MF Nylon",
      mechanical: new MechanicalProperties({
        tensileModulus: GPa(1.7),
        tensileStrengthBreak: MPa(36),
        tensileStrengthYield: MPa(51),
        flexuralModulus: GPa(1.4),
        flexuralStrength: MPa(50),
        impactNotchedIzod: Jm(110),
        density: gcm3(1.1),
      }),
      thermal: new ThermalProperties({
        heatDeflectionAt66Psi: C(41),
      }),
    },
    {
      material: "CF-Nylon",
      name: "MF Onyx",
      mechanical: new MechanicalProperties({
        tensileModulus: GPa(2.4),
        tensileStrengthBreak: MPa(37),
        tensileStrengthYield: MPa(40),
        flexuralModulus: GPa(3.0),
        flexuralStrength: MPa(71),
        impactNotchedIzod: Jm(330),
        density: gcm3(1.2),
      }),
      thermal: new ThermalProperties({
        heatDeflectionAt66Psi: C(145),
      }),
    },
    {
      material: "CF-Nylon",
      name: "MF Onyx w/ CF",
      mechanical: new MechanicalProperties({
        tensileModulus: GPa(60),
        tensileStrengthUltimate: MPa(800),
        flexuralModulus: GPa(51),
        flexuralStrength: MPa(540),
        impactNotchedIzod: Jm(960),
        density: gcm3(1.4),
      }),
      thermal: new ThermalProperties({
        heatDeflectionAt66Psi: C(105),
      }),
    },
    {
      material: "CF-Nylon",
      name: "MF Onyx w/ Kevlar",
      mechanical: new MechanicalProperties({
        tensileModulus: GPa(27),
        tensileStrengthUltimate: MPa(610),
        flexuralModulus: GPa(26),
        flexuralStrength: MPa(240),
        impactNotchedIzod: Jm(2000),
        density: gcm3(1.2),
      }),
      thermal: new ThermalProperties({
        heatDeflectionAt66Psi: C(105),
      }),
    },
    {
      material: "CF-Nylon",
      name: "MF Onyx w/ Fiberglass",
      mechanical: new MechanicalProperties({
        tensileModulus: GPa(21),
        tensileStrengthUltimate: MPa(590),
        flexuralModulus: GPa(22),
        flexuralStrength: MPa(200),
        impactNotchedIzod: Jm(2600),
        density: gcm3(1.5),
      }),
      thermal: new ThermalProperties({
        heatDeflectionAt66Psi: C(105),
      }),
    },
    {
      material: "CF-Nylon",
      name: "MF Onyx w/ HSHT Fiberglass",
      mechanical: new MechanicalProperties({
        tensileModulus: GPa(21),
        tensileStrengthUltimate: MPa(600),
        flexuralModulus: GPa(21),
        flexuralStrength: MPa(420),
        impactNotchedIzod: Jm(3100),
        density: gcm3(1.5),
      }),
      thermal: new ThermalProperties({
        heatDeflectionAt66Psi: C(150),
      }),
    },
  ],
  "name"
);
