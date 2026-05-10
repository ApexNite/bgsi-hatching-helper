// https://github.com/cprosche/mulberry32
export class SeededRandom {
  constructor(seed) {
    this._state = (Number(seed) || 0) >>> 0;
  }

  next() {
    let t = (this._state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInteger(min, max) {
    let a = Math.ceil(Number(min));
    let b = Math.floor(Number(max));

    if (b < a) [a, b] = [b, a];

    const span = b - a + 1;
    return a + Math.floor(this.next() * span);
  }
}
