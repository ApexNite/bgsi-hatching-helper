import Decimal from "decimal.js";

Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -40,
  toExpPos: 40,
});

export const D = (value, fallback = 0) => {
  if (value == null || value === "") {
    return new Decimal(fallback);
  }

  try {
    return new Decimal(value);
  } catch {
    return new Decimal(fallback);
  }
};

export const toNumber = (value, fallback = 0) => {
  const n = Number(D(value, fallback).toString());
  return Number.isFinite(n) ? n : fallback;
};

export const add = (a, b) => toNumber(D(a).plus(D(b)));
export const sub = (a, b) => toNumber(D(a).minus(D(b)));
export const mul = (a, b) => toNumber(D(a).times(D(b)));
export const div = (a, b) => toNumber(D(a).div(D(b)));
export const pow = (a, b) => toNumber(D(a).pow(D(b)));
export const exp = (a) => toNumber(D(a).exp());
export const ln = (a) => toNumber(D(a).ln());

export const sumBy = (items, getter) =>
  toNumber(
    (items || []).reduce(
      (acc, item) => acc.plus(D(getter(item))),
      new Decimal(0),
    ),
  );

export const gt = (a, b) => D(a).gt(D(b));
export const gte = (a, b) => D(a).gte(D(b));
export const max = (a, b) => toNumber(Decimal.max(D(a), D(b)));
