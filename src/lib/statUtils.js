import { get } from "svelte/store";
import { dataStore, isDataLoaded } from "./dataStore.js";

export function calculateStats(sources, toggles, numbers) {
  if (!get(isDataLoaded)) {
    return null;
  }

  const data = get(dataStore);
  const dailyPerksData = data.dailyPerks;
  const indexData = data.index;
  const masteryData = data.mastery;

  const totals = {
    luck: 2,
    secretLuck: 1,
    infinityLuck: 1,
    shinyChance: 0,
    mythicChance: 0,
    hatchSpeed: 1,
    luckMultiplier: 0,
    secretLuckMultiplier: 1,
    infinityLuckMultiplier: 1,
    shinyChanceMultiplier: 1,
    mythicChanceMultiplier: 1,
    hatchSpeedMultiplier: 0,
    baseLuck: 0,
    baseSecretLuck: 0,
    baseInfinityLuck: 0,
    baseShinyChance: 1 / 40,
    baseMythicChance: 1 / 100,
    baseHatchSpeed: 0,
  };

  const eventBonusMultipliers = collectEventBonusMultipliers(sources);

  for (const source of sources) {
    const adjusted = applyEventBonusMultipliersToSource(
      source,
      eventBonusMultipliers,
    );
    applySource(totals, adjusted);
  }

  applySource(totals, calculateBubbleBlessing(numbers.shrineBlessing));
  applySource(totals, calculateDreamerBlessing(numbers.dreamerBlessing));
  applySource(totals, calculateSeasonPerks(numbers.seasonStars));

  if (toggles.worldNormal) {
    if (indexData?.normal) {
      applySource(totals, indexData.normal);
    }
  }

  if (toggles.worldShiny) {
    if (indexData?.shiny) {
      applySource(totals, indexData.shiny);
    }
  }

  if (toggles.fasterHatchMastery) {
    if (masteryData?.fasterHatch) {
      applySource(totals, masteryData.fasterHatch);
    }
  }

  if (numbers.luckierTogether > 0) {
    if (masteryData?.luckierTogether) {
      applySource(totals, {
        ...masteryData.luckierTogether,
        _value: Number(numbers.luckierTogether),
      });
    }
  }

  const today = dailyPerksData
    ? dailyPerksData[new Date().getUTCDay()]
    : undefined;
  const selectedPerks = today
    ? toggles.dailyPerks
      ? today.premium
      : today.normal
    : undefined;

  if (selectedPerks) {
    applySource(totals, selectedPerks);
  }

  const stats = calculateStatsFromTotals(totals);

  // just a bandage; need to figure out the real discrepency somehow
  stats.luck -= totals.luckMultiplier > 0 ? 0 : 1;

  return stats;
}

export function calculateManualStats(manualStats, sources) {
  const totals = {
    luck: 0,
    secretLuck: 0,
    infinityLuck: 0,
    shinyChance: 0,
    mythicChance: 0,
    hatchSpeed: 0,
    baseLuck: 1 + manualStats.luck / 100,
    baseSecretLuck: manualStats.secretLuck,
    baseInfinityLuck: manualStats.infinityLuck || 1,
    baseShinyChance: 1 / manualStats.shinyChance,
    baseMythicChance: 1 / manualStats.mythicChance,
    baseHatchSpeed: manualStats.hatchSpeed / 100,
  };

  const eventBonusMultipliers = collectEventBonusMultipliers(sources);

  for (const source of sources) {
    const adjusted = applyEventBonusMultipliersToSource(
      source,
      eventBonusMultipliers,
    );
    applySource(totals, adjusted);
  }

  return calculateStatsFromTotals(totals);
}

function calculateStatsFromTotals(totals) {
  return {
    luck:
      (totals.baseLuck || 0) +
      (totals.luck || 0) * (totals.luckMultiplier || 1),
    secretLuck:
      (totals.baseSecretLuck || 0) +
      (totals.secretLuck || 0) * (totals.secretLuckMultiplier || 1),
    infinityLuck:
      (totals.baseInfinityLuck || 0) +
      (totals.infinityLuck || 0) * (totals.infinityLuckMultiplier || 1),
    shinyChance:
      (totals.baseShinyChance || 0) *
      (1 + (totals.shinyChance || 0)) *
      (totals.shinyChanceMultiplier || 1),
    mythicChance:
      (totals.baseMythicChance || 0) *
      (1 + totals.mythicChance) *
      (totals.mythicChanceMultiplier || 1),
    hatchSpeed:
      (totals.baseHatchSpeed || 0) +
      (totals.hatchSpeed || 0) * (totals.hatchSpeedMultiplier || 1),
  };
}

function applySource(totals, source) {
  if (!totals) {
    return;
  }

  if (!source) {
    return;
  }

  const times = source._value != null ? Number(source._value) : 1;
  if (!times) {
    return;
  }

  if (typeof source.luck === "number") {
    totals.luck += source.luck * times;
  }

  if (typeof source.hatchSpeed === "number") {
    totals.hatchSpeed += source.hatchSpeed * times;
  }

  if (typeof source.shinyChance === "number") {
    totals.shinyChance += source.shinyChance * times;
  }

  if (typeof source.mythicChance === "number") {
    totals.mythicChance += source.mythicChance * times;
  }

  if (typeof source.secretLuck === "number") {
    totals.secretLuck += source.secretLuck * times;
  }

  if (typeof source.infinityLuck === "number") {
    totals.infinityLuck += source.infinityLuck * times;
  }

  if (typeof source.luckMultiplier === "number") {
    totals.luckMultiplier += source.luckMultiplier;
  }

  if (typeof source.hatchSpeedMultiplier === "number") {
    totals.hatchSpeedMultiplier += source.hatchSpeedMultiplier;
  }

  if (typeof source.shinyChanceMultiplier === "number") {
    totals.shinyChanceMultiplier *= source.shinyChanceMultiplier;
  }

  if (typeof source.mythicChanceMultiplier === "number") {
    if (source.overwriteMythicChanceMultiplier) {
      totals.mythicChanceMultiplier = source.mythicChanceMultiplier;
      totals._mythicChanceMultiplierOverwritten = true;
    } else if (!totals._mythicChanceMultiplierOverwritten) {
      totals.mythicChanceMultiplier *= source.mythicChanceMultiplier;
    }
  }

  if (typeof source.secretLuckMultiplier === "number") {
    totals.secretLuckMultiplier *= source.secretLuckMultiplier;
  }

  if (typeof source.infinityLuckMultiplier === "number") {
    totals.infinityLuckMultiplier *= source.infinityLuckMultiplier;
  }

  if (typeof source.baseLuck === "number") {
    totals.baseLuck += source.baseLuck * times;
  }

  if (typeof source.baseHatchSpeed === "number") {
    totals.baseHatchSpeed += source.baseHatchSpeed * times;
  }

  if (typeof source.baseShinyChance === "number") {
    totals.baseShinyChance += source.baseShinyChance * times;
  }

  if (typeof source.baseMythicChance === "number") {
    totals.baseMythicChance += source.baseMythicChance * times;
  }

  if (typeof source.baseSecretLuck === "number") {
    totals.baseSecretLuck += source.baseSecretLuck * times;
  }

  if (typeof source.baseInfinityLuck === "number") {
    totals.baseInfinityLuck += source.baseInfinityLuck * times;
  }
}

function calculateBubbleBlessing(level) {
  const levelClamped = clamp(level, 0, 50);
  const luck =
    levelClamped >= 1 ? 0.15 + ((1.5 - 0.15) * (levelClamped - 1)) / 49 : 0;
  const baseHatchSpeed =
    levelClamped >= 20
      ? 0.05 + ((0.25 - 0.05) * (levelClamped - 20)) / 30 + 1
      : 0;

  return { luck, baseHatchSpeed };
}

function calculateDreamerBlessing(level) {
  const levelClamped = clamp(level, 0, 50);
  const secretLuckMultiplier =
    levelClamped > 10 ? 1 + (2 + (levelClamped - 10) * 1.2) / 100 : null;

  return { secretLuckMultiplier };
}

function calculateSeasonPerks(stars) {
  const starsClamped = clamp(stars, 0, 1500);

  return {
    luck: starsClamped / 600,
    hatchSpeed: starsClamped / 7500,
  };
}

function clamp(value, min, max) {
  const numericValue = Number(value) || 0;

  if (numericValue < min) {
    return min;
  }

  if (numericValue > max) {
    return max;
  }

  return numericValue;
}

function collectEventBonusMultipliers(sources) {
  const result = {};

  for (const s of sources || []) {
    const isProvider =
      typeof s?.potionLuckMultiplier === "number" ||
      typeof s?.potionShinyChanceMultiplier === "number" ||
      typeof s?.potionMythicChanceMultiplier === "number" ||
      typeof s?.potionSecretLuckMultiplier === "number" ||
      typeof s?.potionInfinityLuckMultiplier === "number" ||
      typeof s?.potionHatchSpeedMultiplier === "number";

    if (!isProvider || !s?.event) {
      continue;
    }

    const ev = s.event;
    if (!result[ev]) {
      result[ev] = [];
    }

    result[ev].push(s);
  }

  return result;
}

function applyEventBonusMultipliersToSource(source, eventBonusMultipliers) {
  if (!source || !source.event) {
    return source;
  }

  const isSpecialBonusProvider =
    typeof source.potionLuckMultiplier === "number" ||
    typeof source.potionShinyChanceMultiplier === "number" ||
    typeof source.potionMythicChanceMultiplier === "number" ||
    typeof source.potionSecretLuckMultiplier === "number" ||
    typeof source.potionInfinityLuckMultiplier === "number" ||
    typeof source.potionHatchSpeedMultiplier === "number";

  if (isSpecialBonusProvider) {
    return source;
  }

  const providers = eventBonusMultipliers?.[source.event];
  if (!providers || providers.length === 0) {
    return source;
  }

  let changed = false;
  const adjusted = { ...source };

  for (const p of providers) {
    if (
      typeof adjusted.luck === "number" &&
      typeof p.potionLuckMultiplier === "number"
    ) {
      adjusted.luck *= p.potionLuckMultiplier;
      changed = true;
    }
    if (
      typeof adjusted.shinyChance === "number" &&
      typeof p.potionShinyChanceMultiplier === "number"
    ) {
      adjusted.shinyChance *= p.potionShinyChanceMultiplier;
      changed = true;
    }
    if (
      typeof adjusted.mythicChance === "number" &&
      typeof p.potionMythicChanceMultiplier === "number"
    ) {
      adjusted.mythicChance *= p.potionMythicChanceMultiplier;
      changed = true;
    }
    if (
      typeof adjusted.secretLuck === "number" &&
      typeof p.potionSecretLuckMultiplier === "number"
    ) {
      adjusted.secretLuck *= p.potionSecretLuckMultiplier;
      changed = true;
    }
    if (
      typeof adjusted.infinityLuck === "number" &&
      typeof p.potionInfinityLuckMultiplier === "number"
    ) {
      adjusted.infinityLuck *= p.potionInfinityLuckMultiplier;
      changed = true;
    }
    if (
      typeof adjusted.hatchSpeed === "number" &&
      typeof p.potionHatchSpeedMultiplier === "number"
    ) {
      adjusted.hatchSpeed *= p.potionHatchSpeedMultiplier;
      changed = true;
    }
  }

  return changed ? adjusted : source;
}
