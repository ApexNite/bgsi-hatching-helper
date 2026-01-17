import { get } from "svelte/store";
import { dataStore, isDataLoaded } from "./dataStore.js";

const DEFAULT_XL_CHANCE_BY_RARITY = Object.freeze({
  infinity: 1 / 500,
  secret: 1 / 500,
  legendary: 1 / 2000,
  epic: 1 / 10000,
  rare: 1 / 25000,
  unique: 1 / 75000,
  common: 1 / 100000,
});

export function calculateStats(sources, toggles, numbers) {
  if (!get(isDataLoaded)) {
    return null;
  }

  const data = get(dataStore);
  const dailyPerksData = data.dailyPerks;
  const indexData = data.index;

  const totals = {
    luck: 1,
    secretLuck: 1,
    infinityLuck: 1,
    shinyChance: 0,
    mythicChance: 0,
    xlChance: 0,
    superLegendaryChance: 0,
    hatchSpeed: 1,
    luckMultiplier: 0,
    secretLuckMultiplier: 1,
    infinityLuckMultiplier: 1,
    shinyChanceMultiplier: 1,
    mythicChanceMultiplier: 1,
    xlChanceMultiplier: 1,
    superLegendaryChanceMultiplier: 1,
    hatchSpeedMultiplier: 0,
    baseLuck: 0,
    baseSecretLuck: 0,
    baseInfinityLuck: 0,
    baseShinyChance: 1 / 40,
    baseMythicChance: 1 / 100,
    baseSuperLegendaryChance: 1 / 2500,
    baseHatchSpeed: 0,
    _applyAdjustedShiny: hasGoldenEggMastery(sources),
    _burstBlessingLevel: getBurstBlessingLevel(sources),
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

  if (numbers.luckierTogether > 0) {
    applySource(totals, {
      ...{ baseLuck: 0.1 },
      _value: Number(numbers.luckierTogether),
    });
  }

  if (numbers.riftMultiplier > 0) {
    applySource(totals, {
      ...{
        baseLuck: numbers.riftMultiplier === 1 ? 0 : numbers.riftMultiplier,
      },
    });
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

  return stats;
}

export function calculateManualStats(manualStats, sources, numbers) {
  const totals = {
    luck: 0,
    secretLuck: 0,
    infinityLuck: 0,
    shinyChance: 0,
    mythicChance: 0,
    xlChance: 0,
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

  if (numbers.riftMultiplier > 0) {
    applySource(totals, {
      ...{
        baseLuck: numbers.riftMultiplier === 1 ? 0 : numbers.riftMultiplier,
      },
    });
  }

  return calculateStatsFromTotals(totals);
}

function calculateStatsFromTotals(totals) {
  const shinyBase =
    (totals.baseShinyChance || 0) *
    (1 + (totals.shinyChance || 0)) *
    (totals.shinyChanceMultiplier || 1);

  const luckBase =
    (totals.baseLuck || 0) + (totals.luck || 0) * (totals.luckMultiplier || 1);

  const getXlChanceForRarity = (rarity) => {
    const base =
      DEFAULT_XL_CHANCE_BY_RARITY[rarity] ?? DEFAULT_XL_CHANCE_BY_RARITY.common;
    return (
      base * (1 + (totals.xlChance || 0)) * (totals.xlChanceMultiplier || 1)
    );
  };

  const getSuperLegendaryChance = (pet) => {
    return (
      totals.baseSuperLegendaryChance *
      (1 + (totals.superLegendaryChance || 0)) *
      (totals.superLegendaryChanceMultiplier || 1)
    );
  };

  return {
    luck: calculateAdjustedLuck(luckBase, totals._burstBlessingLevel || 0),
    secretLuck:
      (totals.baseSecretLuck || 0) +
      (totals.secretLuck || 0) * (totals.secretLuckMultiplier || 1),
    infinityLuck:
      (totals.baseInfinityLuck || 0) +
      (totals.infinityLuck || 0) * (totals.infinityLuckMultiplier || 1),
    shinyChance: totals._applyAdjustedShiny
      ? calculateAdjustedShiny(shinyBase)
      : shinyBase,
    mythicChance:
      (totals.baseMythicChance || 0) *
      (1 + totals.mythicChance) *
      (totals.mythicChanceMultiplier || 1),
    hatchSpeed:
      (totals.baseHatchSpeed || 0) +
      (totals.hatchSpeed || 0) * (totals.hatchSpeedMultiplier || 1),

    getXlChanceForRarity,
    getSuperLegendaryChance,
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

  if (typeof source.xlChance === "number") {
    totals.xlChance += source.xlChance * times;
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

  if (typeof source.xlChanceMultiplier === "number") {
    totals.xlChanceMultiplier *= source.xlChanceMultiplier;
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

  if (typeof source.superLegendaryChance === "number") {
    totals.superLegendaryChance += source.superLegendaryChance * times;
  }

  if (typeof source.superLegendaryChanceMultiplier === "number") {
    totals.superLegendaryChanceMultiplier *=
      source.superLegendaryChanceMultiplier;
  }
}

function calculateBubbleBlessing(level) {
  const levelClamped = Math.floor(clamp(level, 0, 50));
  const luck =
    levelClamped >= 1 ? 0.15 + ((1.5 - 0.15) * (levelClamped - 1)) / 49 + 1 : 0;
  const baseHatchSpeed =
    levelClamped >= 20
      ? 0.05 + ((0.25 - 0.05) * (levelClamped - 20)) / 30 + 1
      : 0;

  return { luck, baseHatchSpeed };
}

function calculateDreamerBlessing(level) {
  const levelClamped = Math.floor(clamp(level, 0, 50));
  const secretLuckMultiplier =
    levelClamped > 10 ? 1 + (2 + (levelClamped - 10) * 1.2) / 100 : null;

  return { secretLuckMultiplier };
}

function calculateSeasonPerks(stars) {
  const starsClamped = Math.floor(clamp(stars, 0, 1500));

  return {
    luck: starsClamped / 600,
    hatchSpeed: starsClamped / 7500,
  };
}

function calculateAdjustedLuck(luck, burstBlessingLevel, interval = 1000) {
  if (!luck || luck <= 0) {
    return 0;
  }

  const level = Math.max(0, Number(burstBlessingLevel) || 0);
  const burstEggMultiplier = level > 0 ? level * 10 : 1;

  return luck * ((interval - 1 + burstEggMultiplier) / interval);
}

function getBurstBlessingLevel(sources) {
  let totalLevel = 0;

  for (const source of sources) {
    if (source.id === "burst-blessing") {
      totalLevel += source._value != null ? Number(source._value) : 1;
    }
  }

  return totalLevel;
}

function calculateAdjustedShiny(shinyChance, interval = 75) {
  const nonGuaranteed = (interval - 1) / interval;
  const guaranteed = 1 / interval;

  return nonGuaranteed * shinyChance + guaranteed;
}

function hasGoldenEggMastery(sources) {
  for (const source of sources) {
    if (source.masteryId === "pets-mastery") {
      return source.levelNumber >= 4;
    }
  }
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

  for (const source of sources || []) {
    const isProvider =
      source.potionLuckMultiplier !== 0 ||
      source.potionHatchSpeedMultiplier !== 0 ||
      source.potionShinyChanceMultiplier !== 1 ||
      source.potionMythicChanceMultiplier !== 1 ||
      source.potionXLChanceMultiplier !== 1 ||
      source.potionSecretLuckMultiplier !== 1 ||
      source.potionInfinityLuckMultiplier !== 1;

    if (!isProvider || !source?.event) {
      continue;
    }

    const ev = source.event;
    if (!result[ev]) {
      result[ev] = [];
    }

    result[ev].push(source);
  }

  return result;
}

function applyEventBonusMultipliersToSource(source, eventBonusMultipliers) {
  if (!source || !source.event) {
    return source;
  }

  const isProvider =
    source.potionLuckMultiplier !== 1 ||
    source.potionHatchSpeedMultiplier !== 1 ||
    source.potionShinyChanceMultiplier !== 1 ||
    source.potionMythicChanceMultiplier !== 1 ||
    source.potionXlChanceMultiplier !== 1 ||
    source.potionSecretLuckMultiplier !== 1 ||
    source.potionInfinityLuckMultiplier !== 1;

  if (isProvider) {
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
      typeof adjusted.xlChance === "number" &&
      typeof p.potionXLChanceMultiplier === "number"
    ) {
      adjusted.xlChance *= p.potionXLChanceMultiplier;
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
