const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;
const DAYS_PER_YEAR = 365.25;
const SECONDS_PER_YEAR = SECONDS_PER_DAY * DAYS_PER_YEAR;

export function formatTime(time) {
  if (!Array.isArray(time)) {
    return formatSeconds(time);
  }

  let [lowerSeconds, upperSeconds] = time;

  return `${formatSeconds(lowerSeconds)} - ${formatSeconds(upperSeconds)}`;
}

export function formatChance(chance) {
  const clampedChance = Number.isFinite(chance)
    ? Math.max(0, Math.min(1, chance))
    : 0;

  return clampedChance < 0.001
    ? formatChanceFraction(clampedChance, "ceil")
    : formatChancePercent(clampedChance);
}

export function formatChancePercent(
  chance,
  forceRound = false,
  roundMode = "none",
  correct = false,
) {
  let percentChance = cleanFloat(chance * 100);

  if (
    correct &&
    Math.abs(percentChance - Math.round(percentChance)) < 0.000001
  ) {
    percentChance = Math.round(percentChance);
  }

  if (percentChance >= 100 || forceRound) {
    if (roundMode === "ceil") {
      return `${Math.ceil(percentChance)}%`;
    }
    if (roundMode === "round") {
      return `${Math.round(percentChance)}%`;
    }
    return `${Math.floor(percentChance)}%`;
  }

  if (percentChance < 0.01) {
    let decimalPlaces = 2;
    let testValue = percentChance;

    while (testValue < 1 && testValue > 0 && decimalPlaces < 20) {
      testValue *= 10;
      decimalPlaces++;
    }

    let str = percentChance.toFixed(decimalPlaces);
    str = str.replace(/\.?0+$/, "");

    return `${str}%`;
  }

  let str = percentChance.toFixed(percentChance >= 10 ? 1 : 2);
  str = str.replace(/\.?0+$/, "");

  return `${str}%`;
}

export function formatChanceFraction(chance, mode = "none") {
  if (!Number.isFinite(chance) || chance <= 0) {
    return "1/∞";
  }

  let denominator =
    mode === "round"
      ? Math.round(1 / chance)
      : mode === "ceil"
        ? Math.ceil(1 / chance)
        : mode === "floor"
          ? Math.floor(1 / chance)
          : Math.round((1 / chance) * 10) / 10;

  return `1/${Math.max(1, denominator).toLocaleString()}`;
}

export function formatMultiplier(
  multiplier,
  decimalPlaces = 1,
  mode = "round",
) {
  if (!Number.isFinite(multiplier)) {
    return "∞x";
  }

  if (Number.isInteger(multiplier)) {
    return `${multiplier}x`;
  }

  const cleanMultiplier = cleanFloat(multiplier);

  const places = Math.max(0, decimalPlaces);
  const factor = Math.pow(10, places);

  let rounded;
  if (mode === "ceil") {
    rounded = Math.ceil(cleanMultiplier * factor) / factor;
  } else if (mode === "floor") {
    rounded = Math.floor(cleanMultiplier * factor) / factor;
  } else {
    rounded = Math.round(cleanMultiplier * factor) / factor;
  }

  if (rounded === 0) {
    return "0x";
  }

  if (Number.isInteger(rounded)) {
    return `${rounded}x`;
  }

  let str = rounded.toFixed(places);
  str = str.replace(/\.?0+$/, "");

  return `${str}x`;
}

export function formatString(text, maxLength = 18) {
  const words = text.split(" ");
  let result = "";
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine + (currentLine ? " " : "") + words[i];

    if (testLine.length > maxLength && currentLine.length > 0) {
      result += currentLine + "\n";
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }

  result += currentLine;
  return result;
}

function formatSeconds(seconds) {
  if (!Number.isFinite(seconds)) {
    return "∞";
  }

  if (seconds < 0) {
    seconds = 0;
  }

  if (seconds < SECONDS_PER_MINUTE) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const days = Math.floor(seconds / SECONDS_PER_DAY);
  const years = Math.floor(seconds / SECONDS_PER_YEAR);

  if (years >= 1) {
    const remainingDays = Math.floor(
      (seconds - years * SECONDS_PER_YEAR) / SECONDS_PER_DAY,
    );
    return remainingDays > 0 ? `${years}y ${remainingDays}d` : `${years}y`;
  }

  if (days >= 1) {
    const remainingHours = Math.floor(
      (seconds - days * SECONDS_PER_DAY) / SECONDS_PER_HOUR,
    );
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }

  if (hours >= 1) {
    const remainingMinutes = Math.floor(
      (seconds - hours * SECONDS_PER_HOUR) / SECONDS_PER_MINUTE,
    );
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }

  const remainingSeconds = Math.floor(seconds - minutes * SECONDS_PER_MINUTE);
  return remainingSeconds > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`;
}

function cleanFloat(num, precision = 12) {
  return parseFloat(Number(num).toPrecision(precision));
}
