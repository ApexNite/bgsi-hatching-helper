import Decimal from "decimal.js";

export const D = (value, fallback = 0) => {
  if (value instanceof Decimal) return value;
  if (value == null || value === "") return new Decimal(fallback);
  if (value === Infinity) return new Decimal(Infinity);
  if (value === -Infinity) return new Decimal(-Infinity);
  if (typeof value === "number" && Number.isNaN(value)) {
    return new Decimal(fallback);
  }

  try {
    return new Decimal(value);
  } catch {
    return new Decimal(fallback);
  }
};

export const add = (a, b) => D(a).plus(D(b));
export const sub = (a, b) => D(a).minus(D(b));
export const mul = (a, b) => D(a).times(D(b));
export const div = (a, b) => D(a).div(D(b));
export const pow = (a, b) => D(a).pow(D(b));

export const gt = (a, b) => D(a).gt(D(b));
export const gte = (a, b) => D(a).gte(D(b));
export const min = (a, b) => Decimal.min(D(a), D(b));
export const max = (a, b) => Decimal.max(D(a), D(b));

export const toNumber = (d) => {
  if (!(d instanceof Decimal)) return Number(d);
  if (!d.isFinite()) return d.isNeg() ? -Infinity : Infinity;
  return d.toNumber();
};
