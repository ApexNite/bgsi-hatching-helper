import { writable } from "svelte/store";

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
  },
  environmentBuff: {
    extends: ["stats", "id", "img"],
    imageDir: { type: "string", default: "icons" },
  },
  event: {
    extends: ["stats", "id", "img"],
    imageDir: { type: "string", default: "icons" },
  },
  eventUpgrade: {
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
  masteryData: {
    luckyStreak: { type: "array", default: [], schema: ["stats", "id"] },
    fasterHatch: { type: "object", schema: "stats" },
    luckierTogether: { type: "object", schema: "stats" },
  },
  milestone: {
    extends: ["id", "img"],
    imageDir: { type: "string", default: "icons" },
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
    extends: ["id", "img"],
    rarity: { type: "string", required: true },
    imageDir: {
      type: "string",
      default: (item, parent) => `pets/${parent.id || parent.imageDir}`,
    },
    baseChance: { type: "number", default: -1 },
    staticMythic: { type: "boolean", default: false },
    hasMythic: { type: "boolean", default: true },
    ignoreSecret: { type: "boolean", default: false },
  },
  potion: {
    extends: ["stats", "id", "img"],
    event: { type: "string", default: "none" },
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
    id: { type: "string", required: true },
    rarity: { type: "string", default: (item) => item.id },
    baseChance: { type: "number", default: -1 },
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
  },
};

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

    const cb = String(Date.now());

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
      fetchJson("/assets/data/daily-perks.json", cb),
      fetchJson("/assets/data/eggs.json", cb),
      fetchJson("/assets/data/enchants.json", cb),
      fetchJson("/assets/data/environment-buffs.json", cb),
      fetchJson("/assets/data/events.json", cb),
      fetchJson("/assets/data/event-potions.json", cb),
      fetchJson("/assets/data/event-special-potions.json", cb),
      fetchJson("/assets/data/event-upgrades.json", cb),
      fetchJson("/assets/data/gamepasses.json", cb),
      fetchJson("/assets/data/index.json", cb),
      fetchJson("/assets/data/mastery.json", cb),
      fetchJson("/assets/data/milestones.json", cb),
      fetchJson("/assets/data/potions.json", cb),
      fetchJson("/assets/data/rifts.json", cb),
      fetchJson("/assets/data/secret-bounty.json", cb),
      fetchJson("/assets/data/special-potions.json", cb),
      fetchJson("/assets/data/worlds.json", cb),
    ]);

    const data = {
      dailyPerks: processData(dailyPerksData, "dailyPerksData"),
      eggs: processData(eggsData, "egg"),
      enchants: processData(enchantsData, ["stats", "id"]),
      environmentBuffs: processData(environmentBuffsData, "environmentBuff"),
      events: processData(eventsData, "event"),
      eventPotions: processData(eventPotionsData, "potionGroup"),
      eventSpecialPotions: processData(eventSpecialPotionsData, "potion"),
      eventUpgrades: processData(eventUpgradesData, "eventUpgrade"),
      gamepasses: processData(gamepassesData, "gamepass"),
      index: processData(indexData, "indexData"),
      mastery: processData(masteryData, "masteryData"),
      milestones: processData(milestonesData, "milestone"),
      potions: processData(potionsData, "potionGroup"),
      rifts: processData(riftsData, ["stats", "id"]),
      secretBounty: processData(secretBountyData, "secretBountyData"),
      specialPotions: processData(specialPotionsData, "potion"),
      worlds: processData(worldsData, "world"),
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

function fetchJson(url, token) {
  const cacheBustUrl = `${url}${url.includes("?") ? "&" : "?"}cb=${encodeURIComponent(token)}`;

  return fetch(cacheBustUrl, { cache: "no-cache" }).then((r) => r.json());
}
