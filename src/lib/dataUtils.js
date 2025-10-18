import dailyPerksJson from "../data/daily-perks.json";
import eggsJson from "../data/eggs.json";
import enchantsJson from "../data/enchants.json";
import environmentBuffsJson from "../data/environment-buffs.json";
import eventsJson from "../data/events.json";
import eventPotionsJson from "../data/event-potions.json";
import gamepassesJson from "../data/gamepasses.json";
import halloweenUpgradesJson from "../data/halloween-upgrades.json";
import indexJson from "../data/index.json";
import masteryJson from "../data/mastery.json";
import milestonesJson from "../data/milestones.json";
import potionsJson from "../data/potions.json";
import riftsJson from "../data/rifts.json";
import secretBountyJson from "../data/secret-bounty.json";
import specialPotionsJson from "../data/special-potions.json";
import worldsJson from "../data/worlds.json";

function processEggsAndPets(eggsArray) {
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

function processPotions(potionsArray) {
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

function processSpecialPotions(specialPotionsArray) {
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

function processMilestones(milestonesArray) {
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

function processWorlds(worldsArray) {
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

export function ensureImagePaths(eggsArray) {
  return processEggsAndPets(eggsArray);
}

export const dailyPerks = processData(dailyPerksJson);
export const eggs = processEggsAndPets(processData(eggsJson));
export const enchants = processData(enchantsJson);
export const environmentBuffs = processData(environmentBuffsJson);
export const events = processData(eventsJson);
export const eventPotions = processPotions(processData(eventPotionsJson));
export const gamepasses = processData(gamepassesJson);
export const halloweenUpgrades = processData(halloweenUpgradesJson);
export const index = processData(indexJson);
export const mastery = processData(masteryJson);
export const milestones = processMilestones(processData(milestonesJson));
export const potions = processPotions(processData(potionsJson));
export const rifts = processData(riftsJson);
export const secretBounty = processData(secretBountyJson);
export const specialPotions = processSpecialPotions(
  processData(specialPotionsJson),
);
export const worlds = processWorlds(processData(worldsJson));
