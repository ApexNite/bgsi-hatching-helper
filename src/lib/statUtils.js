export function calculateBubbleBlessing(level) {
    const levelClamped = clamp(level, 0, 50);
    const hasLevel = levelClamped >= 1;
    const luck = hasLevel ? 0.15 + ((1.5 - 0.15) * (levelClamped - 1)) / 49 : 0;
    const baseHatchSpeed = (hasLevel ? 1 : 0) + (levelClamped >= 20 ? 0.05 + ((0.25 - 0.05) * (levelClamped - 20)) / 30 : 0);

    return { luck, baseHatchSpeed };
}

export function calculateDreamerBlessing(level) {
    const levelClamped = clamp(level, 0, 50);
    const secretLuckMultiplier = levelClamped > 10 ? 1 + ((2 + (levelClamped - 10) * 1.2) / 100) : null;

    return { secretLuckMultiplier };
}

export function calculateSeasonPerks(stars) {
    const starsClamped = clamp(stars, 0, 1500);

    return {
        luck: starsClamped / 600,
        hatchSpeed: starsClamped / 7500
    };
}

export function calculateStats(modifiers, toggles, numbers, dailyPerksData, indexData, masteryData) {
    const {
        shrineBlessing = 0,
        dreamerBlessing = 0,
        seasonStars = 0,
        luckierTogether = 0,
        eggsPerHatch = 1
    } = numbers;

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

    const applySource = (source) => {
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
    };

    for (const source of modifiers) {
        applySource(source);
    }

    applySource(calculateBubbleBlessing(shrineBlessing));
    applySource(calculateDreamerBlessing(dreamerBlessing));
    applySource(calculateSeasonPerks(seasonStars));

    if (toggles.worldNormal) {
        if (indexData?.normal) {
            applySource(indexData.normal);
        }
    }

    if (toggles.worldShiny) {
        if (indexData?.shiny) {
            applySource(indexData.shiny);
        }
    }

    if (toggles.fasterHatchMastery) {
        if (masteryData?.fasterHatch) {
            applySource(masteryData.fasterHatch);
        }
    }

    if (luckierTogether > 0) {
        if (masteryData?.luckierTogether) {
            applySource({ ...masteryData.luckierTogether, _value: Number(luckierTogether) });
        }
    }

    const dayIndex = new Date().getUTCDay();
    const today = dailyPerksData ? dailyPerksData[dayIndex] : undefined;
    const selectedPerks = today ? (toggles.dailyPerks ? today.premium : today.normal) : undefined;
    if (selectedPerks) {
        applySource(selectedPerks);
    }

    const effectiveLuckMultiplier = totals.luckMultiplier || 1;
    const effectiveShinyMultiplier = totals.shinyChanceMultiplier || 1;
    const effectiveMythicMultiplier = totals.mythicChanceMultiplier || 1;
    const effectiveHatchMultiplier = totals.hatchSpeedMultiplier || 1;
    const effectiveSecretLuckMultiplier = totals.secretLuckMultiplier || 1;

    return {
        luck: totals.baseLuck + totals.luck * effectiveLuckMultiplier - 1,
        secretLuck: totals.baseSecretLuck + totals.secretLuck * effectiveSecretLuckMultiplier,
        shinyChance: totals.baseShinyChance * (1 + totals.shinyChance) * effectiveShinyMultiplier,
        mythicChance: totals.baseMythicChance * (1 + totals.mythicChance) * effectiveMythicMultiplier,
        hatchSpeed: totals.baseHatchSpeed + totals.hatchSpeed * effectiveHatchMultiplier,
        eggsPerHatch
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