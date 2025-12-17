import { writable } from "svelte/store";
import dailyPerksCompiled from "../../data/daily-perks.json";
import eggsCompiled from "../../data/eggs.json";
import enchantsCompiled from "../../data/enchants.json";
import environmentBuffsCompiled from "../../data/environment-buffs.json";
import eventsCompiled from "../../data/events.json";
import gamepassesCompiled from "../../data/gamepasses.json";
import indexCompiled from "../../data/index.json";
import masteriesCompiled from "../../data/masteries.json";
import milestonesCompiled from "../../data/milestones.json";
import potionsCompiled from "../../data/potions.json";
import riftsCompiled from "../../data/rifts.json";
import secretBountyCompiled from "../../data/secret-bounty.json";
import specialPotionsCompiled from "../../data/special-potions.json";
import upgradesCompiled from "../../data/upgrades.json";
import worldsCompiled from "../../data/worlds.json";
import dataHashCompiled from "../data/hash.json";

const schemas = {
  stats: {
    luck: { type: "number", default: 0 },
    secretLuck: { type: "number", default: 0 },
    infinityLuck: { type: "number", default: 0 },
    shinyChance: { type: "number", default: 0 },
    mythicChance: { type: "number", default: 0 },
    hatchSpeed: { type: "number", default: 0 },
    baseLuck: { type: "number", default: 0 },
    baseSecretLuck: { type: "number", default: 0 },
    baseInfinityLuck: { type: "number", default: 0 },
    baseShinyChance: { type: "number", default: 0 },
    baseMythicChance: { type: "number", default: 0 },
    baseHatchSpeed: { type: "number", default: 0 },
    luckMultiplier: { type: "number", default: 0 },
    secretLuckMultiplier: { type: "number", default: 1 },
    infinityLuckMultiplier: { type: "number", default: 1 },
    shinyChanceMultiplier: { type: "number", default: 1 },
    mythicChanceMultiplier: { type: "number", default: 1 },
    hatchSpeedMultiplier: { type: "number", default: 0 },
    potionLuckMultiplier: { type: "number", default: 0 },
    potionSecretLuckMultiplier: { type: "number", default: 1 },
    potionInfinityLuckMultiplier: { type: "number", default: 1 },
    potionShinyChanceMultiplier: { type: "number", default: 1 },
    potionMythicChanceMultiplier: { type: "number", default: 1 },
    potionHatchSpeedMultiplier: { type: "number", default: 0 },
    overwriteMythicChanceMultiplier: { type: "boolean", default: false },
  },
  id: {
    id: { type: "string", required: true },
    name: { type: "string", default: (item) => item.id },
  },
  img: {
    extends: "id",
    imageDir: {
      type: "string",
      default: (item, parent) => item.imageDir || parent?.imageDir || "unknown",
    },
    img: {
      type: "string",
      default: (item) => `assets/images/${item.imageDir}/${item.id}`,
    },
  },
  hatchable: {
    rarity: { type: "string", required: true },
    baseChance: { type: "number", default: -1 },
    staticMythic: { type: "boolean", default: false },
    hasMythic: { type: "boolean", default: true },
    ignoreLuck: { type: "boolean", default: false },
    ignoreSecret: { type: "boolean", default: false },
  },
  dailyPerk: {
    imageDir: { type: "string", default: "perk" },
    normal: { type: "object", default: {}, schema: "stats" },
    premium: { type: "object", default: {}, schema: "stats" },
    pets: { type: "array", default: [], schema: "pet" },
  },
  dailyPerksData: {
    0: { type: "object", default: {}, schema: "dailyPerk" },
    1: { type: "object", default: {}, schema: "dailyPerk" },
    2: { type: "object", default: {}, schema: "dailyPerk" },
    3: { type: "object", default: {}, schema: "dailyPerk" },
    4: { type: "object", default: {}, schema: "dailyPerk" },
    5: { type: "object", default: {}, schema: "dailyPerk" },
    6: { type: "object", default: {}, schema: "dailyPerk" },
  },
  egg: {
    extends: ["id", "img"],
    imageDir: { type: "string", default: "eggs" },
    type: { type: "string", default: "special" },
    world: {
      type: "string",
      default: "the-overworld",
      condition: (item) => item.type === "world",
    },
    includeInInfinity: {
      type: "array",
      default: [],
      itemType: "string",
      condition: (item) => item.type !== "infinity",
    },
    event: { type: "string", default: "none" },
    riftable: { type: "boolean", default: false },
    pets: {
      type: "array",
      default: [],
      condition: (item) => item.type !== "infinity",
      schema: "pet",
    },
    rarities: {
      type: "array",
      default: [],
      condition: (item) => item.type === "infinity",
      schema: "rarity",
    },
    raritiesByWorld: {
      type: "object",
      default: {},
      condition: (item) => item.type === "infinity",
      schema: "rarity",
      map: true,
    },
  },
  environmentBuff: {
    extends: ["stats", "id", "img"],
    imageDir: { type: "string", default: "icons" },
  },
  event: {
    extends: ["stats", "id", "img"],
    imageDir: { type: "string", default: "icons" },
  },
  upgrade: {
    extends: ["id", "img"],
    imageDir: { type: "string", default: "icons" },
    event: { type: "string", default: "none" },
    levels: { type: "object", default: {} },
  },
  gamepass: {
    extends: ["stats", "id", "img"],
    imageDir: { type: "string", default: "icons" },
  },
  indexData: {
    normal: { type: "object", schema: "stats" },
    shiny: { type: "object", schema: "stats" },
  },
  mastery: {
    extends: ["id", "img"],
    imageDir: { type: "string", default: "icons" },
    event: { type: "string", default: "none" },
    levels: { type: "array", default: [], schema: "masteryLevel" },
  },
  masteryLevel: {
    extends: ["stats", "id"],
    img: {
      type: "string",
      default: null,
    },
    masteryId: {
      type: "string",
      default: (item, parent) => parent?.id || null,
    },
    masteryName: {
      type: "string",
      default: (item, parent) => parent?.name || parent?.id || null,
    },
    levelNumber: {
      type: "number",
      default: (item) => {
        if (item.id === "none") {
          return 0;
        }

        if (item.id === "max") {
          return 999;
        }

        const n = item.id.match(/level-(\d+)/);

        return n ? Number(n[1]) : 0;
      },
    },
  },
  milestone: {
    extends: ["id", "img"],
    imageDir: { type: "string", default: "icons" },
    event: { type: "string", default: "none" },
    tiers: { type: "array", default: [], schema: "milestoneTier" },
  },
  milestoneTier: {
    extends: ["stats", "id"],
    img: {
      type: "string",
      default: (item) =>
        `assets/images/milestones/${item.id.replace(/-.*/, "")}`,
      condition: (item) => item.id !== "none",
    },
  },
  pet: {
    extends: ["id", "img", "hatchable"],
    imageDir: {
      type: "string",
      default: (item, parent) => `pets/${parent.id || parent.imageDir}`,
    },
  },
  potion: {
    extends: ["stats", "id", "img"],
    event: {
      type: "string",
      default: (item, parent) => parent?.event || "none",
    },
    imageDir: { type: "string", default: "potions" },
    img: {
      type: "string",
      default: (item) => `assets/images/${item.imageDir}/${item.id}`,
      condition: (item) => item.id !== "none",
    },
  },
  potionGroup: {
    extends: ["id", "img"],
    event: { type: "string", default: "none" },
    potions: { type: "array", default: [], schema: "potion" },
  },
  rarity: {
    extends: ["id", "hatchable"],
    rarity: { type: "string", default: (item) => item.id },
  },
  secretBountyData: {
    imageDir: { type: "string", default: "bounty" },
    pets: {
      type: "object",
      default: {},
      schema: "pet",
      map: true,
    },
    eggs: {
      type: "object",
      default: {},
      schema: "secretBountyEntry",
      map: true,
    },
  },
  secretBountyEntry: {
    pet: { type: "string", required: true },
    egg: { type: "string", required: true },
    date: { type: "string", default: (item, parent, key) => String(key) },
  },
  world: {
    extends: ["id", "img"],
    imageDir: { type: "string", default: "worlds" },
    event: { type: "string", default: "none" },
  },
};

export const dataStore = writable({
  dailyPerks: null,
  eggs: null,
  enchants: null,
  environmentBuffs: null,
  events: null,
  upgrades: null,
  gamepasses: null,
  index: null,
  masteries: null,
  milestones: null,
  potions: null,
  rifts: null,
  secretBounty: null,
  specialPotions: null,
  worlds: null,
  dataHash: null,
});

let consecutiveFailures = 0;
let currentHash = dataHashCompiled.hash;
let currentLastUpdated = dataHashCompiled.lastUpdated;
let hashPollIntervalId = null;

export const isDataLoaded = writable(false);
export const dataError = writable(null);

function buildDataFromSources(sources) {
  return {
    dailyPerks: processData(sources.dailyPerks, "dailyPerksData"),
    eggs: processData(sources.eggs, "egg"),
    enchants: processData(sources.enchants, ["stats", "id"]),
    environmentBuffs: processData(sources.environmentBuffs, "environmentBuff"),
    events: processData(sources.events, "event"),
    upgrades: processData(sources.upgrades, "upgrade"),
    gamepasses: processData(sources.gamepasses, "gamepass"),
    index: processData(sources.index, "indexData"),
    masteries: processData(sources.masteries, "mastery"),
    milestones: processData(sources.milestones, "milestone"),
    potions: processData(sources.potions, "potionGroup"),
    rifts: processData(sources.rifts, ["stats", "id"]),
    secretBounty: processData(sources.secretBounty, "secretBountyData"),
    specialPotions: processData(sources.specialPotions, "potion"),
    worlds: processData(sources.worlds, "world"),
    dataHash: sources.dataHash,
  };
}

const compiledSources = {
  dailyPerks: dailyPerksCompiled,
  eggs: eggsCompiled,
  enchants: enchantsCompiled,
  environmentBuffs: environmentBuffsCompiled,
  events: eventsCompiled,
  gamepasses: gamepassesCompiled,
  index: indexCompiled,
  masteries: masteriesCompiled,
  milestones: milestonesCompiled,
  potions: potionsCompiled,
  rifts: riftsCompiled,
  secretBounty: secretBountyCompiled,
  specialPotions: specialPotionsCompiled,
  upgrades: upgradesCompiled,
  worlds: worldsCompiled,
  dataHash: dataHashCompiled,
};

export async function loadData() {
  try {
    dataError.set(null);

    if (await shouldUpdate()) {
      const data = buildDataFromSources(compiledSources);

      dataStore.set(data);
      isDataLoaded.set(true);
      consecutiveFailures = 0;
      currentHash = data.dataHash?.hash;
      currentLastUpdated = data.dataHash?.lastUpdated;

      return data;
    }

    const [
      dailyPerksData,
      eggsData,
      enchantsData,
      environmentBuffsData,
      eventsData,
      gamepassesData,
      indexData,
      masteriesData,
      milestonesData,
      potionsData,
      riftsData,
      secretBountyData,
      specialPotionsData,
      upgradesData,
      worldsData,
      dataHashJson,
    ] = await Promise.all([
      fetchJson("/assets/data/daily-perks.json"),
      fetchJson("/assets/data/eggs.json"),
      fetchJson("/assets/data/enchants.json"),
      fetchJson("/assets/data/environment-buffs.json"),
      fetchJson("/assets/data/events.json"),
      fetchJson("/assets/data/gamepasses.json"),
      fetchJson("/assets/data/index.json"),
      fetchJson("/assets/data/masteries.json"),
      fetchJson("/assets/data/milestones.json"),
      fetchJson("/assets/data/potions.json"),
      fetchJson("/assets/data/rifts.json"),
      fetchJson("/assets/data/secret-bounty.json"),
      fetchJson("/assets/data/special-potions.json"),
      fetchJson("/assets/data/upgrades.json"),
      fetchJson("/assets/data/worlds.json"),
      fetchJson("/assets/data/hash.json"),
    ]);

    const data = buildDataFromSources({
      dailyPerks: dailyPerksData,
      eggs: eggsData,
      enchants: enchantsData,
      environmentBuffs: environmentBuffsData,
      events: eventsData,
      gamepasses: gamepassesData,
      index: indexData,
      masteries: masteriesData,
      milestones: milestonesData,
      potions: potionsData,
      rifts: riftsData,
      secretBounty: secretBountyData,
      specialPotions: specialPotionsData,
      upgrades: upgradesData,
      worlds: worldsData,
      dataHash: dataHashJson,
    });

    dataStore.set(data);
    isDataLoaded.set(true);
    consecutiveFailures = 0;
    currentHash = data.dataHash?.hash;
    currentLastUpdated = data.dataHash?.lastUpdated;

    return data;
  } catch (error) {
    isDataLoaded.set(false);
    dataError.set(
      "Failed to load data. Please check your internet connection and try again.",
    );

    if (++consecutiveFailures >= 5) {
      window.location.reload();
    }

    return null;
  } finally {
    if (hashPollIntervalId !== null) {
      return;
    }

    hashPollIntervalId = setInterval(async () => {
      try {
        await loadData();
      } catch {}
    }, 30000);
  }
}

export function processData(
  data,
  schemaName,
  parentItem = null,
  itemKey = null,
) {
  const typeMatches = (expected, val) =>
    expected === "array"
      ? Array.isArray(val)
      : expected === "object"
        ? val !== null && typeof val === "object" && !Array.isArray(val)
        : typeof val === expected;

  const resolveSchema = (name) => {
    const merged = {};
    const visited = new Set();
    const stack = new Set();

    const visit = (cur) => {
      if (!schemas[cur] || stack.has(cur) || visited.has(cur)) {
        return;
      }

      stack.add(cur);

      const parents = schemas[cur].extends;
      if (Array.isArray(parents)) {
        for (const p of parents) {
          if (typeof p === "string") {
            visit(p);
          }
        }
      } else if (typeof parents === "string") {
        visit(parents);
      }

      for (const [k, v] of Object.entries(schemas[cur])) {
        if (k !== "extends") {
          merged[k] = v;
        }
      }

      visited.add(cur);
      stack.delete(cur);
    };

    visit(name);

    return merged;
  };

  const resolveSchemaLike = (s) => {
    if (typeof s === "string") {
      return resolveSchema(s);
    }

    if (Array.isArray(s)) {
      const merged = {};
      for (const part of s) {
        if (typeof part === "string") {
          Object.assign(merged, resolveSchema(part));
        }
      }

      return merged;
    }

    return {};
  };

  const schema = resolveSchemaLike(schemaName);

  const isValid = (item) => {
    for (const [field, cfg] of Object.entries(schema)) {
      if (cfg.required) {
        const val = item[field];

        if (val === undefined || !typeMatches(cfg.type, val)) {
          return false;
        }
      }
    }

    return true;
  };

  const applyDefault = (item, parent, key, field, cfg, out) => {
    const itemCtx = out && typeof out === "object" ? { ...item, ...out } : item;

    const def =
      typeof cfg.default === "function"
        ? cfg.default(itemCtx, parent, key)
        : cfg.default;

    if (cfg.schema) {
      if (cfg.type === "array") {
        out[field] = Array.isArray(def)
          ? processData(def, cfg.schema, out, null)
          : [];
      } else if (cfg.type === "object") {
        if (cfg.map) {
          out[field] = {};
        } else {
          const nested = processData(
            def && typeof def === "object" ? def : {},
            cfg.schema,
            out,
            null,
          );
          out[field] = nested && typeof nested === "object" ? nested : {};
        }
      } else {
        out[field] = def;
      }
    } else {
      out[field] = def;
    }
  };

  const processItem = (item, parent, key) => {
    const out = {};
    for (const [field, cfg] of Object.entries(schema)) {
      if (cfg.condition && !cfg.condition(item)) {
        continue;
      }

      const value = item[field];

      if (!typeMatches(cfg.type, value)) {
        applyDefault(item, parent, key, field, cfg, out);

        continue;
      }

      if (cfg.type === "array") {
        if (cfg.schema) {
          out[field] = processData(value, cfg.schema, out, null);
        } else if (cfg.itemType) {
          const seen = new Set();
          const arr = [];

          for (const v of value) {
            if (typeof v === cfg.itemType && !seen.has(v)) {
              seen.add(v);
              arr.push(v);
            }
          }

          out[field] = arr;
        } else {
          out[field] = [...value];
        }

        continue;
      }

      if (cfg.type === "object") {
        if (cfg.schema) {
          if (cfg.map) {
            if (Array.isArray(value)) {
              out[field] = {};
            } else {
              const mapped = {};

              for (const [k, child] of Object.entries(value)) {
                if (child && typeof child === "object") {
                  const processed = processData(child, cfg.schema, out, k);

                  if (processed && typeof processed === "object") {
                    mapped[k] = processed;
                  }
                }
              }

              out[field] = mapped;
            }
          } else {
            if (Array.isArray(value)) {
              out[field] = {};
            } else {
              const nested = processData(value, cfg.schema, out, null);
              out[field] = nested && typeof nested === "object" ? nested : {};
            }
          }
        } else {
          out[field] = Array.isArray(value) ? {} : { ...value };
        }

        continue;
      }

      out[field] = value;
    }

    return out;
  };

  if (Array.isArray(data)) {
    const out = [];
    const seenIds = new Set();

    for (const item of data) {
      if (!item || typeof item !== "object" || !isValid(item)) {
        continue;
      }

      if (typeof item.id === "string") {
        if (seenIds.has(item.id)) {
          continue;
        }

        seenIds.add(item.id);
      }

      out.push(processItem(item, parentItem, null));
    }

    return out;
  }

  if (!data || typeof data !== "object" || !isValid(data)) {
    return {};
  }

  return processItem(data, parentItem, itemKey);
}

async function shouldUpdate() {
  const json = await fetchJson("/assets/data/hash.json");
  const nextHash = json?.hash;
  const nextLastUpdated = json?.lastUpdated;

  if (nextHash && nextHash === currentHash) {
    return false;
  }

  if (!nextLastUpdated) {
    return true;
  }

  const nextTime = new Date(nextLastUpdated).getTime();
  const currentTime = new Date(currentLastUpdated).getTime();

  return nextTime > currentTime;
}

function fetchJson(url) {
  return fetchThroughCache(url).then((r) => r.json());
}

function fetchThroughCache(url) {
  const token = String(Date.now());
  const cacheBustUrl = `${url}${url.includes("?") ? "&" : "?"}cb=${encodeURIComponent(token)}`;

  return fetch(cacheBustUrl, { cache: "no-cache" });
}
