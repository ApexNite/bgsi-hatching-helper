export function calculateStats(sources, toggles, numbers, dailyPerksData, indexData, masteryData) {
    const totals = {
        luck: 2,
        secretLuck: 1,
        shinyChance: 0,
        mythicChance: 0,
        hatchSpeed: 1,
        luckMultiplier: 0,
        secretLuckMultiplier: 1,
        shinyChanceMultiplier: 0,
        mythicChanceMultiplier: 0,
        hatchSpeedMultiplier: 0,
        baseLuck: 0,
        baseSecretLuck: 0,
        baseShinyChance: 1 / 40,
        baseMythicChance: 1 / 100,
        baseHatchSpeed: 0
    };

    for (const source of sources) {
        applySource(totals, source);
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
            applySource(totals, { ...masteryData.luckierTogether, _value: Number(numbers.luckierTogether) });
        }
    }

    const today = dailyPerksData ? dailyPerksData[new Date().getUTCDay()] : undefined;
    const selectedPerks = today ? (toggles.dailyPerks ? today.premium : today.normal) : undefined;
    
    if (selectedPerks) {
        applySource(totals, selectedPerks);
    }

    const stats = calculateStatsFromTotals(totals);

    return stats;
}

export function calculateManualStats(manualStats, rift) {
    const totals = {
        luck: 0,
        secretLuck: 0,
        shinyChance: 0,
        mythicChance: 0,
        hatchSpeed: 0,
        baseLuck: 1 + manualStats.luck / 100,
        baseSecretLuck: manualStats.secretLuck,
        baseShinyChance: 1 / manualStats.shinyChance,
        baseMythicChance: 1 / manualStats.mythicChance,
        baseHatchSpeed: manualStats.hatchSpeed / 100
    };

    applySource(totals, rift);

    return calculateStatsFromTotals(totals);
}

function calculateStatsFromTotals(totals) {
    return {
        luck: (totals.baseLuck || 0) + (totals.luck || 0) * (totals.luckMultiplier || 1),
        secretLuck: (totals.baseSecretLuck || 0) + (totals.secretLuck || 0) * (totals.secretLuckMultiplier || 1),
        shinyChance: (totals.baseShinyChance || 0) * (1 + (totals.shinyChance || 0)) * (totals.shinyChanceMultiplier || 1),
        mythicChance: (totals.baseMythicChance || 0) * (1 + totals.mythicChance) * (totals.mythicChanceMultiplier || 1),
        hatchSpeed: (totals.baseHatchSpeed || 0) + (totals.hatchSpeed || 0) * (totals.hatchSpeedMultiplier || 1),
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

    if (typeof source.luckMultiplier === "number") {
        totals.luckMultiplier += source.luckMultiplier;
    }

    if (typeof source.hatchSpeedMultiplier === "number") {
        totals.hatchSpeedMultiplier += source.hatchSpeedMultiplier;
    }

    if (typeof source.shinyChanceMultiplier === "number") {
        totals.shinyChanceMultiplier += source.shinyChanceMultiplier;
    }

    if (typeof source.mythicChanceMultiplier === "number") {
        if (source.overwriteMythicChanceMultiplier) {
            totals.mythicChanceMultiplier = source.mythicChanceMultiplier;
        } else {
            totals.mythicChanceMultiplier += source.mythicChanceMultiplier;
        }
    }

    if (typeof source.secretLuckMultiplier === "number") {
        totals.secretLuckMultiplier *= source.secretLuckMultiplier;
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
}

function calculateBubbleBlessing(level) {
    const levelClamped = clamp(level, 0, 50);
    const hasLevel = levelClamped >= 1;
    const luck = hasLevel ? 0.15 + ((1.5 - 0.15) * (levelClamped - 1)) / 49 : 0;
    const baseHatchSpeed = (hasLevel ? 1 : 0) + (levelClamped >= 20 ? 0.05 + ((0.25 - 0.05) * (levelClamped - 20)) / 30 : 0);

    return { luck, baseHatchSpeed };
}

function calculateDreamerBlessing(level) {
    const levelClamped = clamp(level, 0, 50);
    const secretLuckMultiplier = levelClamped > 10 ? 1 + ((2 + (levelClamped - 10) * 1.2) / 100) : null;

    return { secretLuckMultiplier };
}

function calculateSeasonPerks(stars) {
    const starsClamped = clamp(stars, 0, 1500);

    return {
        luck: starsClamped / 600,
        hatchSpeed: starsClamped / 7500
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