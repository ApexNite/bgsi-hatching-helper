import dailyPerks from "../data/daily-perks.json";
import eggs from "../data/eggs.json";
import secretBounty from "../data/secret-bounty.json";

const BASE_HATCH_SECONDS = 4.5;
const RARITY_ORDER = Object.freeze({
    common: 0,
    unique: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
    secret: 5,
    infinity: 6
});

export function getPetsToDisplay(eggId, worldId, stats) {
    const eggs = getEggsWithInjectedPets();
    const egg = eggs?.find(e => e.id === eggId);
    
    if (!egg) {
        return [];
    }

    const isInfinity = egg.type === 'infinity';
    let worldEggs = null;

    if (isInfinity) {
        worldEggs = eggs.filter(
            e => e.world === worldId || e.includeInInfinity?.includes(worldId)
        );
    }

    let pets;

    if (isInfinity) {
        pets = normalizeInfinityEgg(egg.rarities, worldEggs, stats);
    } else {
        pets = normalizeEgg(egg.pets, stats);
    }

    return sortByRarity(pets);
}

export function calculateHatchTime(chance, hatchSpeed, eggsPerHatch) {
    if (!chance || !eggsPerHatch || !hatchSpeed) {
        return Infinity;
    }

    return (1 / chance) / calculateEggsPerSecond(hatchSpeed, eggsPerHatch);
}

export function calculateEggsPerSecond(hatchSpeed, eggsPerHatch) {
    return (1 / BASE_HATCH_SECONDS) * hatchSpeed * eggsPerHatch;
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
    const correctRarity = pet.rarity === 'legendary' || pet.rarity === 'secret' || pet.rarity === 'infinity';
    const hasMythic = pet.hasMythic !== false;

    return correctRarity && hasMythic;
}

function getEggsWithInjectedPets() {
    if (!eggs) {
        return {};
    }
    
    const eggsCopy = JSON.parse(JSON.stringify(eggs));

    const now = new Date();
    const utcDay = now.getUTCDay();
    const utcDate = now.toISOString().slice(0, 10).replace(/-/g, '');

    const perk = dailyPerks?.[utcDay];
    if (perk?.pets?.length) {
        for (const egg of eggsCopy) {
            egg.pets = egg.pets || [];
            for (const perkPet of perk.pets) {
                if (!egg.pets.some(p => p.id === perkPet.id)) {
                    egg.pets.push(perkPet)
                };
            }
        }
    }

    const bounty = secretBounty?.eggs?.[utcDate];
    if (bounty) {
        const bountyPet = secretBounty?.pets?.[bounty.pet];
        if (bountyPet) {
            const targetEgg = eggsCopy.find(e => e.id === bounty.egg);
            if (targetEgg) {
                targetEgg.pets = targetEgg.pets || [];

                if (!targetEgg.pets.some(p => p.id === bountyPet.id)) {
                    targetEgg.pets.push(bountyPet);
                }
            }
        }
    }

    return eggsCopy;
}

function normalizeData(items) {
    if (!items?.length) {
        return [];
    }

    const list = items.map(p => ({
        ...p,
        rarity: p.rarity ?? 'common',
        baseChance: Number(p.baseChance ?? 0),
        rawChance: Number(p.baseChance ?? 0)
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
    const epicLuckMultiplier = Math.min(baseLuckMultiplier, 4);

    for (const item of list) {
        switch (item.rarity) {
            case 'secret':
            case 'infinity':
                item.rawChance = item.baseChance * baseLuckMultiplier * secretLuckMultiplier;
                break;
            case 'legendary':
                item.rawChance = item.baseChance * baseLuckMultiplier;
                break;
            case 'epic':
                item.rawChance = item.baseChance * epicLuckMultiplier;
                break;
            default:
                item.rawChance = item.baseChance;
        }
    }

    const epicIncrease = list
        .filter(item => item.rarity === 'epic')
        .reduce((sum, item) => sum + (item.rawChance - item.baseChance), 0);

    if (epicIncrease > 0) {
        redistributeDecrease(
            list,
            epicIncrease,
            item => !['epic', 'legendary', 'secret', 'infinity'].includes(item.rarity) && item.rawChance > 0
        );
    }

    let totalRawChance = list.reduce((sum, item) => sum + item.rawChance, 0);
    
    if (!(totalRawChance > 0)) {
        totalRawChance = 1;
    }

    return list.map(item => ({
        ...item,
        finalChance: item.rawChance / totalRawChance
    }));
}

function removeDuplicatePetsFromEggs(eggs) {
    const seenPetIds = new Set();
    
    for (const egg of eggs) {
        if (!egg.pets) {
            continue;
        }
        
        egg.pets = egg.pets.filter(pet => {
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
            0
        );

        if (totalBaseChance > 0) {
            for (const pet of normalizedPets) {
                const shareWithinRarity = (pet.baseChance ?? 0) / totalBaseChance;
                results.push({
                    ...pet,
                    finalChance: rarityEntry.finalChance * shareWithinRarity
                });
            }
        } else {
            const perPetChance = rarityEntry.finalChance / petsInRarity.length;
            for (const pet of petsInRarity) {
                results.push({
                    ...pet,
                    finalChance: perPetChance
                });
            }
        }
    }

    return results;
}

function redistributeDecrease(list, amount, isEligible) {
    const EPSILON = 1e-15;
    let remaining = amount;

    let indices = list
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => isEligible(item))
        .map(({ index }) => index);

    while (remaining > EPSILON && indices.length > 0) {
        const perIndexDecrease = remaining / indices.length;
        let consumedAmount = 0;
        const nextIndices = [];

        for (const index of indices) {
            const availableToReduce = list[index].rawChance;
            const decrease = Math.min(perIndexDecrease, availableToReduce);
            list[index].rawChance = availableToReduce - decrease;
            consumedAmount += decrease;
            if (list[index].rawChance > EPSILON) {
                nextIndices.push(index);
            }
        }

        remaining -= consumedAmount;
        indices = nextIndices;
    }
}