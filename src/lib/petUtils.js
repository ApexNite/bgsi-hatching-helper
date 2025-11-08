import { get } from "svelte/store";
import { dataStore, isDataLoaded, processData } from "./dataStore.js";

const BASE_HATCH_SECONDS = 4.2;
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

  let pets;

  if (isInfinity) {
    pets = normalizeInfinityEgg(egg.rarities, worldEggs, stats);
  } else {
    pets = normalizeEgg(egg.pets, stats);
  }

  pets = addVariantChances(sortByRarity(pets), stats);

  return pets;
}

export function calculateHatchTime(chance, hatchSpeed, eggsPerHatch) {
  if (!chance || !eggsPerHatch || !hatchSpeed) {
    return Infinity;
  }

  return 1 / chance / calculateEggsPerSecond(hatchSpeed, eggsPerHatch);
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
    items.reduce((acc, p) => acc + (Number(p[key]) || 0), 0);

  const makeAggregateRow = (id, name, rarity, items) => {
    const finalChance = sumChance(items, "finalChance");
    const finalShinyChance = sumChance(items, "finalShinyChance");
    const finalMythicChance = sumChance(items, "finalMythicChance");
    const finalShinyMythicChance = sumChance(items, "finalShinyMythicChance");

    if (
      !(
        finalChance > 0 ||
        finalShinyChance > 0 ||
        finalMythicChance > 0 ||
        finalShinyMythicChance > 0
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
      finalShinyChance,
      finalMythicChance,
      finalShinyMythicChance,
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
      : 0;

    pet.finalShinyChance = pet.finalChance * shinyMultiplier;
    pet.finalMythicChance = pet.finalChance * mythicMultiplier;
    pet.finalShinyMythicChance =
      pet.finalChance * shinyMultiplier * mythicMultiplier;
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

function normalizeData(items) {
  if (!items?.length) {
    return [];
  }

  const list = items.map((p) => ({
    ...p,
    rarity: p.rarity ?? "common",
    baseChance: Number(p.baseChance ?? 0),
    rawChance: Number(p.baseChance ?? 0),
  }));

  let totalBaseChance = list.reduce((sum, item) => sum + item.baseChance, 0);

  if (!(totalBaseChance > 0)) {
    totalBaseChance = 1;
  }

  for (const item of list) {
    item.baseChance = item.baseChance / totalBaseChance;
    item.rawChance = item.baseChance;
  }

  return list;
}

function normalizeEgg(items, stats) {
  const list = normalizeData(items);

  const baseLuckMultiplier = stats?.luck ?? 1;
  const secretLuckMultiplier = stats?.secretLuck ?? 1;
  const infinityLuckMultiplier = stats?.infinityLuck ?? 1;
  const epicLuckMultiplier = Math.min(baseLuckMultiplier, 4);

  for (const item of list) {
    switch (item.rarity) {
      case "infinity":
        item.rawChance =
          item.baseChance *
          baseLuckMultiplier *
          (item.ignoreSecret ? 1 : secretLuckMultiplier) *
          infinityLuckMultiplier;
        break;
      case "secret":
        item.rawChance =
          item.baseChance *
          baseLuckMultiplier *
          (item.ignoreSecret ? 1 : secretLuckMultiplier);
        break;
      case "legendary":
        item.rawChance = item.baseChance * baseLuckMultiplier;
        break;
      case "epic":
        item.rawChance = item.baseChance * epicLuckMultiplier;
        break;
      default:
        item.rawChance = item.baseChance;
    }
  }

  const epicIncrease = list
    .filter((item) => item.rarity === "epic")
    .reduce((sum, item) => sum + (item.rawChance - item.baseChance), 0);

  if (epicIncrease > 0) {
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

  const normalizedRarities = normalizeEgg(rarities, stats);
  const petsByRarity = new Map();

  for (const egg of worldEggs) {
    for (const pet of egg.pets) {
      const list = petsByRarity.get(pet.rarity) ?? [];
      list.push(pet);
      petsByRarity.set(pet.rarity, list);
    }
  }

  const results = [];
  for (const rarityEntry of normalizedRarities) {
    const petsInRarity = petsByRarity.get(rarityEntry.rarity) ?? [];
    if (petsInRarity.length === 0) {
      continue;
    }

    const normalizedPets = normalizeData(petsInRarity);
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
