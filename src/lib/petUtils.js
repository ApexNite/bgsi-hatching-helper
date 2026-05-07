import { get } from "svelte/store";
import { dataStore, isDataLoaded, processData } from "./dataStore.js";
import {
  D,
  add,
  sub,
  mul,
  div,
  pow,
  gt,
  gte,
  min,
  max,
  toNumber,
} from "./mathDecimal.js";
import { getFlag } from "../debug.js";

const BASE_HATCH_SECONDS = D(4.5);
const RARITY_ORDER = Object.freeze({
  common: 0,
  unique: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  secret: 5,
  celestial: 6,
  infinity: 7,
});

export function getPetsToDisplay(eggId, worldId, stats) {
  const eggsWithPets = getEggsWithInjectedPets(
    Number(stats?.trueLuck ?? 1) <= 1,
  );
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
    ? normalizeInfinityEgg(selectedRarities, worldEggs, stats, worldId)
    : normalizeEgg(egg.pets, stats);

  return addVariantChances(sortByRarity(pets), stats);
}

export function calculateMeanHatchTime(chance, hatchSpeed, eggsPerHatch) {
  if (!chance || !eggsPerHatch || !hatchSpeed || chance === Infinity) {
    return Infinity;
  }

  const cps = calculateEggsPerSecond(hatchSpeed, eggsPerHatch);
  if (!(cps > 0)) {
    return Infinity;
  }

  return toNumber(D(1).div(D(chance)).div(D(cps)), Infinity);
}

export function calculateHatchTime(
  chance,
  hatchSpeed,
  eggsPerHatch,
  probability,
) {
  if (!chance || !eggsPerHatch || !hatchSpeed || chance === Infinity) {
    return Infinity;
  }

  const c = D(chance);
  const p = D(probability);

  if (!c.gt(0) || !c.lt(1) || !p.gt(0) || !p.lt(1)) {
    return Infinity;
  }

  const eggsNeeded = D(1).minus(p).ln().div(D(1).minus(c).ln());
  const cps = D(calculateEggsPerSecond(hatchSpeed, eggsPerHatch));

  if (!cps.gt(0)) {
    return Infinity;
  }

  return toNumber(eggsNeeded.div(cps), Infinity);
}

export function calculateEggsPerSecond(hatchSpeed, eggsPerHatch) {
  return toNumber(
    D(hatchSpeed).times(D(eggsPerHatch)).div(BASE_HATCH_SECONDS),
    0,
  );
}

export function sortByRarity(pets) {
  pets.sort((a, b) => {
    const rarityRankA = RARITY_ORDER[getSortRarity(a)] ?? 999;
    const rarityRankB = RARITY_ORDER[getSortRarity(b)] ?? 999;

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

export function isSuperLegendaryEligible(pet) {
  return pet.rarity === "legendary" && pet.baseChance < 0.000001;
}

export function insertAggregateRows(
  pets,
  {
    anyLegendary = false,
    anySecret = false,
    anyCelestial = false,
    anyInfinity = false,
    superLegendaryOnly = false,
  } = {},
) {
  if (
    !Array.isArray(pets) ||
    (!anyLegendary && !anySecret && !anyCelestial && !anyInfinity)
  ) {
    return pets;
  }

  const sumChance = (items, key) => sumBy(items, (p) => max(Number(p[key]), 0));

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
    const finalSuperLegendaryChance = sumChance(
      items,
      "finalSuperLegendaryChance",
    );
    const finalShinySuperLegendaryChance = sumChance(
      items,
      "finalShinySuperLegendaryChance",
    );
    const finalMythicSuperLegendaryChance = sumChance(
      items,
      "finalMythicSuperLegendaryChance",
    );
    const finalShinyMythicSuperLegendaryChance = sumChance(
      items,
      "finalShinyMythicSuperLegendaryChance",
    );
    const finalXLSuperLegendaryChance = sumChance(
      items,
      "finalXLSuperLegendaryChance",
    );
    const finalShinyXLSuperLegendaryChance = sumChance(
      items,
      "finalShinyXLSuperLegendaryChance",
    );
    const finalMythicXLSuperLegendaryChance = sumChance(
      items,
      "finalMythicXLSuperLegendaryChance",
    );
    const finalShinyMythicXLSuperLegendaryChance = sumChance(
      items,
      "finalShinyMythicXLSuperLegendaryChance",
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
        finalShinyMythicXLChance > 0 ||
        finalSuperLegendaryChance > 0 ||
        finalShinySuperLegendaryChance > 0 ||
        finalMythicSuperLegendaryChance > 0 ||
        finalShinyMythicSuperLegendaryChance > 0 ||
        finalXLSuperLegendaryChance > 0 ||
        finalShinyXLSuperLegendaryChance > 0 ||
        finalMythicXLSuperLegendaryChance > 0 ||
        finalShinyMythicXLSuperLegendaryChance > 0
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
      finalSuperLegendaryChance,
      finalShinySuperLegendaryChance,
      finalMythicSuperLegendaryChance,
      finalShinyMythicSuperLegendaryChance,
      finalXLSuperLegendaryChance,
      finalShinyXLSuperLegendaryChance,
      finalMythicXLSuperLegendaryChance,
      finalShinyMythicXLSuperLegendaryChance,
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
      (p) =>
        p.rarity === "legendary" &&
        (!superLegendaryOnly || isSuperLegendaryEligible(p)) &&
        hasPositiveChance(p),
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

  if (anySecret) {
    const secrets = pets.filter((p) => {
      return (
        (p.rarity === "secret" || p.rarity === "infinity") &&
        hasPositiveChance(p)
      );
    });

    if (secrets.length > 1) {
      const agg = makeAggregateRow(
        "__agg_secret",
        "Any Secret+",
        "secret",
        secrets,
      );

      if (agg) {
        aggregates.push(agg);
      }
    }
  }

  if (anyCelestial) {
    const celestials = pets.filter(
      (p) =>
        (isCelestialPet(p) || p.rarity === "infinity") && hasPositiveChance(p),
    );

    if (celestials.length > 1) {
      const agg = makeAggregateRow(
        "__agg_celestial",
        "Any Celestial+",
        "secret",
        celestials,
      );

      if (agg) {
        agg.celestial = true;
        aggregates.push(agg);
      }
    }
  }

  if (anyInfinity) {
    const infinities = pets.filter(
      (p) => p.rarity === "infinity" && hasPositiveChance(p),
    );

    if (infinities.length > 1) {
      const agg = makeAggregateRow(
        "__agg_infinity",
        "Any Infinity",
        "infinity",
        infinities,
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

export function isCelestialPet(pet) {
  return Boolean(
    pet?.celestial ||
      (!pet?.__aggregate &&
        pet?.rarity === "secret" &&
        typeof pet?.baseChance === "number" &&
        pet.baseChance <= 4e-11),
  );
}

function addVariantChances(pets, stats) {
  const shinyMultiplier = stats?.shinyChance ?? 0;
  const baseMythicMultiplier = stats?.mythicChance ?? 0;
  const baseSuperLegendaryChance =
    typeof stats?.getSuperLegendaryChance === "function"
      ? stats.getSuperLegendaryChance()
      : 0;

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

    const superLegendaryEligible = isSuperLegendaryEligible(pet);
    const slMultiplier = superLegendaryEligible ? baseSuperLegendaryChance : 0;

    pet.finalShinyChance = pet.finalChance * shinyMultiplier;
    pet.finalMythicChance = pet.finalChance * mythicMultiplier;
    pet.finalXLChance = pet.finalChance * xlMultiplier;
    pet.finalShinyXLChance = pet.finalChance * shinyMultiplier * xlMultiplier;
    pet.finalMythicXLChance = pet.finalChance * mythicMultiplier * xlMultiplier;
    pet.finalShinyMythicChance =
      pet.finalChance * shinyMultiplier * mythicMultiplier;
    pet.finalShinyMythicXLChance =
      pet.finalChance * shinyMultiplier * mythicMultiplier * xlMultiplier;
    pet.finalSuperLegendaryChance = superLegendaryEligible
      ? pet.finalChance * slMultiplier
      : pet.finalChance;
    pet.finalShinySuperLegendaryChance = superLegendaryEligible
      ? pet.finalShinyChance * slMultiplier
      : pet.finalShinyChance;
    pet.finalMythicSuperLegendaryChance = superLegendaryEligible
      ? pet.finalMythicChance * slMultiplier
      : pet.finalMythicChance;
    pet.finalShinyMythicSuperLegendaryChance = superLegendaryEligible
      ? pet.finalShinyMythicChance * mythicMultiplier * slMultiplier
      : pet.finalShinyMythicChance;
    pet.finalXLSuperLegendaryChance = superLegendaryEligible
      ? pet.finalXLChance * slMultiplier
      : pet.finalXLChance;
    pet.finalShinyXLSuperLegendaryChance = superLegendaryEligible
      ? pet.finalShinyXLChance * slMultiplier
      : pet.finalShinyXLChance;
    pet.finalMythicXLSuperLegendaryChance = superLegendaryEligible
      ? pet.finalMythicXLChance * slMultiplier
      : pet.finalMythicXLChance;
    pet.finalShinyMythicXLSuperLegendaryChance = superLegendaryEligible
      ? pet.finalShinyMythicXLChance * slMultiplier
      : pet.finalShinyMythicXLChance;
  }

  return pets;
}

export function getEggsWithInjectedPets(trueLuckEgg) {
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
    if (bountyPet && (!bountyPet.ignoreTrueLuck || trueLuckEgg)) {
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

function normalizeEgg(items, stats = {}, isInfinityEgg = false) {
  if (!items?.length) return [];

  let pool = items.map((p) => ({
    ...p,
    rawChance: D(p.baseChance ?? 0),
  }));

  const rarity = (item) => item.rarity;

  const isEpic = (item) => rarity(item) === "epic";

  const isLegendaryOrSecret = (item) =>
    rarity(item) === "legendary" ||
    rarity(item) === "secret" ||
    rarity(item) === "infinity";

  const isSecret = (item) =>
    rarity(item) === "secret" || rarity(item) === "infinity";

  const isInfinity = (item) => rarity(item) === "infinity";

  const ignoresLuck = (item) => item?.ignoreLuck === true;
  const ignoresSecretLuck = (item) => item?.ignoreSecret === true;

  const applyMultiplierRespectingIgnore = (
    currentPool,
    multiplier,
    matchFn,
    protectFn = null,
    ignoreFn = null,
  ) => {
    const shouldIgnore =
      typeof ignoreFn === "function" ? ignoreFn : () => false;

    const effectiveMatch = (item) => matchFn(item) && !shouldIgnore(item);
    const effectiveProtect = protectFn
      ? (item) => protectFn(item) || shouldIgnore(item)
      : (item) => shouldIgnore(item);

    return applyMultiplierToPool(
      currentPool,
      multiplier,
      effectiveMatch,
      effectiveProtect,
    );
  };

  const luck = D(stats.luck ?? 1);

  const secretLuck = D(stats.secretLuck ?? 1)
    .div(2)
    .plus(
      D(0.5).times(
        D(stats.secretLuck ?? 1)
          .minus(1)
          .div(10)
          .neg()
          .exp(),
      ),
    );
  const infinityLuck = D(stats.infinityLuck ?? 1);
  const celestialLuck = D(stats.celestialLuck ?? 1);
  const epicLuck = min(luck, D(4));

  pool = applyMultiplierRespectingIgnore(
    pool,
    epicLuck,
    isEpic,
    isLegendaryOrSecret,
    ignoresLuck,
  );
  pool = applyMultiplierRespectingIgnore(
    pool,
    luck,
    isLegendaryOrSecret,
    null,
    ignoresLuck,
  );

  if (gt(secretLuck, 1)) {
    pool = applyMultiplierRespectingIgnore(
      pool,
      secretLuck,
      isSecret,
      null,
      ignoresSecretLuck,
    );
  }

  if (gt(infinityLuck, 1)) {
    pool = applyMultiplierToPool(pool, infinityLuck, isInfinity);
  }

  if (gt(celestialLuck, 1)) {
    pool = applyMultiplierToPool(pool, celestialLuck, isCelestialPet);
  }

  let total = pool.reduce((sum, i) => sum.plus(i.rawChance), D(0));

  if (!gt(total, 0)) {
    total = D(1);
  }

  return pool.map((item) => ({
    ...item,
    finalChance: toNumber(item.rawChance.div(total)),
  }));
}

function applyMultiplierToPool(pool, multiplier, matchFn, protectFn = null) {
  let totalIncrease = D(0);

  const next = pool.map((item) => {
    if (matchFn(item)) {
      const old = item.rawChance;
      const updated = old.times(multiplier);

      totalIncrease = totalIncrease.plus(updated.minus(old));

      return { ...item, rawChance: updated };
    }

    return { ...item };
  });

  const candidates = [];

  for (let i = 0; i < pool.length; i++) {
    const item = pool[i];

    if (!matchFn(item)) {
      if (!protectFn || !protectFn(item)) {
        candidates.push(i);
      }
    }
  }

  if (gt(totalIncrease, 0) && candidates.length > 0) {
    const reduction = totalIncrease.div(candidates.length);

    for (const i of candidates) {
      next[i].rawChance = max(D(0), next[i].rawChance.minus(reduction));
    }
  }

  return next;
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

function normalizeInfinityEgg(rarities, worldEggs, stats, worldId) {
  if (!rarities || !worldEggs?.length) {
    return [];
  }

  removeDuplicatePetsFromEggs(worldEggs);

  const normalizedRarities = normalizeEgg(rarities, stats, true);
  const petsByRarity = new Map();
  const data = get(dataStore);
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcDate = now.toISOString().slice(0, 10).replace(/-/g, "");
  const bounty = data.secretBounty?.eggs?.[utcDate];

  if (
    worldId == "seven-seas" &&
    bounty &&
    data.eggs.find((e) => e.id === bounty.egg)?.world == "the-overworld"
  ) {
    const bountyPet = data.secretBounty?.pets?.[bounty.pet];
    if (bountyPet) {
      const rarityKey =
        bountyPet.rarity === "infinity" ? "secret" : bountyPet.rarity;
      const list = petsByRarity.get(rarityKey) ?? [];
      list.push(bountyPet);
      petsByRarity.set(rarityKey, list);
    }
  }

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

  const decreasePerItem = div(amount, eligibleItems.length);

  for (const item of eligibleItems) {
    item.rawChance = max(0, D(item.rawChance).minus(D(decreasePerItem)));
  }
}

function getSortRarity(pet) {
  if (pet?.rarity === "infinity") {
    return "infinity";
  }

  if (isCelestialPet(pet)) {
    return "celestial";
  }

  return pet?.rarity ?? "common";
}
