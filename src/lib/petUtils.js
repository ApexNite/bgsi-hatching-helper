import { get } from "svelte/store";
import { dataStore, isDataLoaded, processData } from "./dataStore.js";

const BASE_HATCH_SECONDS = 4.5;
const RARITY_ORDER = Object.freeze({
  common: 0,
  unique: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  secret: 5,
  infinity: 6,
});

export function getPetsToDisplay(eggId, worldId, stats) {
  const eggsWithPets = getEggsWithInjectedPets();
  const egg = eggsWithPets?.find((e) => e.id === eggId);

  if (!egg) {
    return [];
  }

  const isInfinity = egg.type === "infinity";
  let worldEggs = null;

  if (isInfinity) {
    worldEggs = eggsWithPets.filter(
      (e) => e.world === worldId || e.includeInInfinity?.includes(worldId),
    );
  }

  const selectedRarities =
    isInfinity && Array.isArray(egg.raritiesByWorld?.[worldId])
      ? egg.raritiesByWorld[worldId]
      : egg.rarities;

  let pets = isInfinity
    ? normalizeInfinityEgg(selectedRarities, worldEggs, stats)
    : normalizeEgg(egg.pets, stats);

  return addVariantChances(sortByRarity(pets), stats);
}

export function calculateMeanHatchTime(chance, hatchSpeed, eggsPerHatch) {
  if (!chance || !eggsPerHatch || !hatchSpeed) {
    return Infinity;
  }

  if (chance === Infinity) {
    return Infinity;
  }

  return 1 / chance / calculateEggsPerSecond(hatchSpeed, eggsPerHatch);
}

export function calculateHatchTime(
  chance,
  hatchSpeed,
  eggsPerHatch,
  probability,
) {
  if (!chance || !eggsPerHatch || !hatchSpeed) {
    return Infinity;
  }

  if (chance === Infinity) {
    return Infinity;
  }

  const eggsNeeded = Math.log(1 - probability) / Math.log(1 - chance);

  return eggsNeeded / calculateEggsPerSecond(hatchSpeed, eggsPerHatch);
}

export function calculateEggsPerSecond(hatchSpeed, eggsPerHatch) {
  return (hatchSpeed * eggsPerHatch) / BASE_HATCH_SECONDS;
}

export function sortByRarity(pets) {
  pets.sort((a, b) => {
    const rarityRankA = RARITY_ORDER[a.rarity] ?? 999;
    const rarityRankB = RARITY_ORDER[b.rarity] ?? 999;

    if (rarityRankA !== rarityRankB) {
      return rarityRankA - rarityRankB;
    }

    return b.finalChance - a.finalChance;
  });

  return pets;
}

export function isMythicEligible(pet) {
  const correctRarity =
    pet.rarity === "legendary" ||
    pet.rarity === "secret" ||
    pet.rarity === "infinity";
  const hasMythic = pet.hasMythic !== false;

  return correctRarity && hasMythic;
}

export function insertAggregateRows(
  pets,
  { anyLegendary = false, anySecretInfinity = false } = {},
) {
  if (!Array.isArray(pets) || (!anyLegendary && !anySecretInfinity)) {
    return pets;
  }

  const sumChance = (items, key) =>
    items.reduce((acc, p) => acc + Math.max(Number(p[key]), 0), 0);

  const makeAggregateRow = (id, name, rarity, items) => {
    const finalChance = sumChance(items, "finalChance");
    const finalXLChance = sumChance(items, "finalXLChance");
    const finalShinyChance = sumChance(items, "finalShinyChance");
    const finalShinyXLChance = sumChance(items, "finalShinyXLChance");
    const finalMythicChance = sumChance(items, "finalMythicChance");
    const finalMythicXLChance = sumChance(items, "finalMythicXLChance");
    const finalShinyMythicChance = sumChance(items, "finalShinyMythicChance");
    const finalShinyMythicXLChance = sumChance(
      items,
      "finalShinyMythicXLChance",
    );

    if (
      !(
        finalChance > 0 ||
        finalXLChance > 0 ||
        finalShinyChance > 0 ||
        finalShinyXLChance > 0 ||
        finalMythicChance > 0 ||
        finalMythicXLChance > 0 ||
        finalShinyMythicChance > 0 ||
        finalShinyMythicXLChance > 0
      )
    ) {
      return null;
    }

    return {
      __aggregate: true,
      __aggregateId: id,
      id,
      name,
      rarity,
      img: null,
      baseChance: 0,
      rawChance: 0,
      finalChance,
      finalXLChance,
      finalShinyChance,
      finalShinyXLChance,
      finalMythicChance,
      finalMythicXLChance,
      finalShinyMythicChance,
      finalShinyMythicXLChance,
    };
  };

  const hasPositiveChance = (pet) => {
    return (
      pet.finalChance > 0 ||
      pet.finalShinyChance > 0 ||
      pet.finalMythicChance > 0 ||
      pet.finalShinyMythicChance > 0
    );
  };

  const aggregates = [];

  if (anyLegendary) {
    const legends = pets.filter(
      (p) => p.rarity === "legendary" && hasPositiveChance(p),
    );

    if (legends.length > 1) {
      const agg = makeAggregateRow(
        "__agg_legendary",
        "Any Legendary",
        "legendary",
        legends,
      );

      if (agg) {
        aggregates.push(agg);
      }
    }
  }

  if (anySecretInfinity) {
    const secretsAndInfinity = pets.filter((p) => {
      return (
        (p.rarity === "secret" || p.rarity === "infinity") &&
        hasPositiveChance(p)
      );
    });

    if (secretsAndInfinity.length > 1) {
      const agg = makeAggregateRow(
        "__agg_secret_infinity",
        "Any Secret",
        "secret",
        secretsAndInfinity,
      );

      if (agg) {
        aggregates.push(agg);
      }
    }
  }

  if (aggregates.length === 0) {
    return pets;
  }

  return sortByRarity([...pets, ...aggregates]);
}

function addVariantChances(pets, stats) {
  const shinyMultiplier = stats?.shinyChance ?? 0;
  const baseMythicMultiplier = stats?.mythicChance ?? 0;

  for (const pet of pets) {
    const mythicEligible = isMythicEligible(pet);
    const mythicMultiplier = mythicEligible
      ? pet.staticMythic
        ? 0.01
        : baseMythicMultiplier
      : -1;

    const xlMultiplier =
      typeof stats?.getXlChanceForRarity === "function"
        ? stats.getXlChanceForRarity(pet.rarity)
        : 0;

    pet.finalShinyChance = pet.finalChance * shinyMultiplier;
    pet.finalMythicChance = pet.finalChance * mythicMultiplier;
    pet.finalXLChance = pet.finalChance * xlMultiplier;
    pet.finalShinyXLChance = pet.finalChance * shinyMultiplier * xlMultiplier;
    pet.finalMythicXLChance = pet.finalChance * mythicMultiplier * xlMultiplier;
    pet.finalShinyMythicChance =
      pet.finalChance * shinyMultiplier * mythicMultiplier;
    pet.finalShinyMythicXLChance =
      pet.finalChance * shinyMultiplier * mythicMultiplier * xlMultiplier;
  }

  return pets;
}

function getEggsWithInjectedPets() {
  const data = get(dataStore);

  if (!isDataLoaded || !data.eggs) {
    return [];
  }

  const eggsCopy = JSON.parse(JSON.stringify(data.eggs));

  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcDate = now.toISOString().slice(0, 10).replace(/-/g, "");

  const perk = data.dailyPerks?.[utcDay];
  if (perk?.pets?.length) {
    for (const egg of eggsCopy) {
      egg.pets = egg.pets || [];
      for (const perkPet of perk.pets) {
        if (!egg.pets.some((p) => p.id === perkPet.id)) {
          egg.pets.push(perkPet);
        }
      }
    }
  }

  const bounty = data.secretBounty?.eggs?.[utcDate];
  if (bounty) {
    const bountyPet = data.secretBounty?.pets?.[bounty.pet];
    if (bountyPet) {
      const targetEgg = eggsCopy.find((e) => e.id === bounty.egg);
      if (targetEgg) {
        targetEgg.pets = targetEgg.pets || [];

        if (!targetEgg.pets.some((p) => p.id === bountyPet.id)) {
          targetEgg.pets.push(bountyPet);
        }
      }
    }
  }

  return processData(eggsCopy, "egg");
}

function normalizeEgg(items, stats, isInfinityEgg = false) {
  if (!items?.length) {
    return [];
  }

  const list = items.map((p) => ({
    ...p,
    rarity: p.rarity ?? "common",
    baseChance: Number(p.baseChance ?? 0),
    rawChance: Number(p.baseChance ?? 0),
  }));

  const baseLuckMultiplier = stats?.luck ?? 1;
  const baseSecretMultiplier = stats?.secretLuck ?? 1;
  const infinityLuckMultiplier = stats?.infinityLuck ?? 1;

  for (const item of list) {
    const luckMultiplier = item.ignoreLuck ? 1 : baseLuckMultiplier;
    const secretMultiplier = item.ignoreSecret ? 1 : baseSecretMultiplier;
    const epicLuck = Math.min(luckMultiplier, 4);

    switch (item.rarity) {
      case "infinity":
        item.rawChance =
          item.baseChance *
          luckMultiplier *
          secretMultiplier *
          infinityLuckMultiplier;
        break;
      case "secret":
        item.rawChance = item.baseChance * luckMultiplier * secretMultiplier;
        break;
      case "legendary":
        item.rawChance = item.baseChance * luckMultiplier;
        break;
      case "epic":
        item.rawChance = item.baseChance * epicLuck;
        break;
      default:
        item.rawChance = item.baseChance;
    }
  }

  const epicIncrease = list
    .filter((item) => item.rarity === "epic")
    .reduce((sum, item) => sum + (item.rawChance - item.baseChance), 0);

  if (epicIncrease > 0 && !isInfinityEgg) {
    redistributeDecrease(
      list,
      epicIncrease,
      (item) =>
        !["epic", "legendary", "secret", "infinity"].includes(item.rarity) &&
        item.rawChance > 0,
    );
  }

  let totalRawChance = list.reduce((sum, item) => sum + item.rawChance, 0);

  if (!(totalRawChance > 0)) {
    totalRawChance = 1;
  }

  return list.map((item) => ({
    ...item,
    finalChance: item.rawChance / totalRawChance,
  }));
}

function removeDuplicatePetsFromEggs(eggs) {
  const seenPetIds = new Set();

  for (const egg of eggs) {
    if (!egg.pets) {
      continue;
    }

    egg.pets = egg.pets.filter((pet) => {
      if (seenPetIds.has(pet.id)) {
        return false;
      }

      seenPetIds.add(pet.id);
      return true;
    });
  }
}

function normalizeInfinityEgg(rarities, worldEggs, stats) {
  if (!rarities || !worldEggs?.length) {
    return [];
  }

  removeDuplicatePetsFromEggs(worldEggs);

  const normalizedRarities = normalizeEgg(rarities, stats, true);
  const petsByRarity = new Map();

  for (const egg of worldEggs) {
    for (const pet of egg.pets) {
      const rarityKey = pet.rarity === "infinity" ? "secret" : pet.rarity;
      const list = petsByRarity.get(rarityKey) ?? [];
      list.push(pet);
      petsByRarity.set(rarityKey, list);
    }
  }

  const results = [];
  for (const rarityEntry of normalizedRarities) {
    const petsInRarity = petsByRarity.get(rarityEntry.rarity) ?? [];
    if (petsInRarity.length === 0) {
      continue;
    }

    const normalizedPets = petsInRarity.map((p) => ({
      ...p,
      rarity: p.rarity ?? "common",
      baseChance: Number(p.baseChance ?? 0),
      rawChance: Number(p.baseChance ?? 0),
    }));

    const totalBaseChance = normalizedPets.reduce(
      (sum, pet) => sum + (pet.baseChance ?? 0),
      0,
    );

    if (totalBaseChance > 0) {
      for (const pet of normalizedPets) {
        const shareWithinRarity = (pet.baseChance ?? 0) / totalBaseChance;
        results.push({
          ...pet,
          finalChance: rarityEntry.finalChance * shareWithinRarity,
        });
      }
    } else {
      const perPetChance = rarityEntry.finalChance / petsInRarity.length;
      for (const pet of petsInRarity) {
        results.push({
          ...pet,
          finalChance: perPetChance,
        });
      }
    }
  }

  return results;
}

function redistributeDecrease(list, amount, isEligible) {
  const eligibleItems = list.filter(isEligible);

  if (eligibleItems.length === 0) {
    return;
  }

  const decreasePerItem = amount / eligibleItems.length;

  for (const item of eligibleItems) {
    item.rawChance = Math.max(0, item.rawChance - decreasePerItem);
  }
}
