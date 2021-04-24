export default class Belt {
  constructor(teeth, pitch, length) {
    this.teeth = teeth;
    this.pitch = pitch;
    this.length = length;
  }

  static fromTeeth(teeth, pitch) {
    return new Belt(teeth, pitch, pitch.mul(teeth));
  }

  static fromLength(length, pitch) {
    return new Belt(
      Number(length.div(pitch).scalar.toFixed(10)),
      pitch,
      length
    );
  }
}
