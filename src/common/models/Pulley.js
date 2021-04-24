export default class Pulley {
  constructor(teeth, pitch, pitchDiameter) {
    this.teeth = teeth;
    this.pitch = pitch;
    this.pitchDiameter = pitchDiameter;
  }

  static fromTeeth(teeth, pitch) {
    return new Pulley(teeth, pitch, pitch.mul(teeth).div(Math.PI));
  }

  static fromPitchDiameter(pitchDiameter, pitch) {
    return new Pulley(
      Number(pitchDiameter.mul(Math.PI).div(pitch).scalar.toFixed(2)),
      pitch,
      pitchDiameter
    );
  }
}
