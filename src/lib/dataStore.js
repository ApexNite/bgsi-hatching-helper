import { writable } from "svelte/store";

export const dataStore = writable({
  dailyPerks: null,
  eggs: null,
  enchants: null,
  environmentBuffs: null,
  events: null,
  eventPotions: null,
  eventSpecialPotions: null,
  eventUpgrades: null,
  gamepasses: null,
  index: null,
  mastery: null,
  milestones: null,
  potions: null,
  rifts: null,
  secretBounty: null,
  specialPotions: null,
  worlds: null,
});

export const isDataLoaded = writable(false);
export const dataError = writable(null);

export async function loadData(startPeriodicRefresh = true) {
  try {
    dataError.set(null);

    const [
      dailyPerksData,
      eggsData,
      enchantsData,
      environmentBuffsData,
      eventsData,
      eventPotionsData,
      eventSpecialPotionsData,
      eventUpgradesData,
      gamepassesData,
      indexData,
      masteryData,
      milestonesData,
      potionsData,
      riftsData,
      secretBountyData,
      specialPotionsData,
      worldsData,
    ] = await Promise.all([
      fetch("/assets/data/daily-perks.json").then((r) => r.json()),
      fetch("/assets/data/eggs.json").then((r) => r.json()),
      fetch("/assets/data/enchants.json").then((r) => r.json()),
      fetch("/assets/data/environment-buffs.json").then((r) => r.json()),
      fetch("/assets/data/events.json").then((r) => r.json()),
      fetch("/assets/data/event-potions.json").then((r) => r.json()),
      fetch("/assets/data/event-special-potions.json").then((r) => r.json()),
      fetch("/assets/data/event-upgrades.json").then((r) => r.json()),
      fetch("/assets/data/gamepasses.json").then((r) => r.json()),
      fetch("/assets/data/index.json").then((r) => r.json()),
      fetch("/assets/data/mastery.json").then((r) => r.json()),
      fetch("/assets/data/milestones.json").then((r) => r.json()),
      fetch("/assets/data/potions.json").then((r) => r.json()),
      fetch("/assets/data/rifts.json").then((r) => r.json()),
      fetch("/assets/data/secret-bounty.json").then((r) => r.json()),
      fetch("/assets/data/special-potions.json").then((r) => r.json()),
      fetch("/assets/data/worlds.json").then((r) => r.json()),
    ]);

    const data = {
      dailyPerks: processData(dailyPerksData),
      eggs: processEggsAndPets(processData(eggsData)),
      enchants: processData(enchantsData),
      environmentBuffs: processData(environmentBuffsData),
      events: processData(eventsData),
      eventPotions: processPotions(processData(eventPotionsData)),
      eventSpecialPotions: processSpecialPotions(
        processData(eventSpecialPotionsData),
      ),
      eventUpgrades: processData(eventUpgradesData),
      gamepasses: processData(gamepassesData),
      index: processData(indexData),
      mastery: processData(masteryData),
      milestones: processMilestones(processData(milestonesData)),
      potions: processPotions(processData(potionsData)),
      rifts: processData(riftsData),
      secretBounty: processData(secretBountyData),
      specialPotions: processSpecialPotions(processData(specialPotionsData)),
      worlds: processWorlds(processData(worldsData)),
    };

    dataStore.set(data);
    isDataLoaded.set(true);

    return data;
  } catch (error) {
    isDataLoaded.set(false);
    dataError.set(
      "Failed to load data. Please check your internet connection and try again.",
    );

    return null;
  } finally {
    if (startPeriodicRefresh) {
      setInterval(() => loadData(false), 300000);
    }
  }
}

export function processEggsAndPets(eggsArray) {
  if (!Array.isArray(eggsArray)) {
    return [];
  }

  for (const egg of eggsArray) {
    if (egg && !egg.img) {
      egg.img = `assets/images/eggs/${egg.id}`;
    }

    if (Array.isArray(egg?.pets)) {
      for (const pet of egg.pets) {
        if (pet && !pet.img) {
          pet.img = `assets/images/pets/${egg.id}/${pet.id}`;
        }
      }
    }
  }

  return eggsArray;
}

export function processPotions(potionsArray) {
  if (!Array.isArray(potionsArray)) {
    return [];
  }

  for (const potion of potionsArray) {
    if (Array.isArray(potion.potions)) {
      for (const subPotion of potion.potions) {
        if (subPotion && !subPotion.img && subPotion.id !== "none") {
          subPotion.img = `assets/images/potions/${subPotion.id}`;
        }
      }
    }
  }

  return potionsArray;
}

export function processSpecialPotions(specialPotionsArray) {
  if (!Array.isArray(specialPotionsArray)) {
    return [];
  }

  for (const potion of specialPotionsArray) {
    if (potion && !potion.img) {
      potion.img = `assets/images/potions/${potion.id}`;
    }
  }

  return specialPotionsArray;
}

export function processMilestones(milestonesArray) {
  if (!Array.isArray(milestonesArray)) {
    return [];
  }

  for (const milestone of milestonesArray) {
    if (Array.isArray(milestone.tiers)) {
      for (const tier of milestone.tiers) {
        if (tier && !tier.img && tier.id !== "none") {
          tier.img = `assets/images/milestones/${tier.id.replace(/-.*/, "")}`;
        }
      }
    }
  }

  return milestonesArray;
}

export function processWorlds(worldsArray) {
  if (!Array.isArray(worldsArray)) {
    return [];
  }

  for (const world of worldsArray) {
    if (world && !world.img) {
      world.img = `assets/images/worlds/${world.id}`;
    }
  }

  return worldsArray;
}

function processData(data) {
  return JSON.parse(JSON.stringify(data));
}
