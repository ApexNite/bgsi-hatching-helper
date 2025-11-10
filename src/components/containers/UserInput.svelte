<script>
  import { calculateStats, calculateManualStats } from "../../lib/statUtils.js";
  import { setCookie, getCookie, deleteCookie } from "../../lib/cookieUtils.js";
  import { dataStore, isDataLoaded, loadData } from "../../lib/dataStore.js";
  import { onMount } from "svelte";

  import Dropdown from "../form/Dropdown.svelte";
  import Checkbox from "../form/Checkbox.svelte";
  import NumberInput from "../form/NumberInput.svelte";
  import WarningBanner from "../warnings/WarningBanner.svelte";
  import SmartImage from "../media/SmartImage.svelte";

  export let stats;
  export let eggsPerHatch;
  export let selectedEggId;
  export let selectedWorldId;

  const COOKIE_VERSION = 6;

  let calculationMode = "calculated";
  let dismissedManualWarning = false;
  let isUserInputReady = false;

  let selectedOptions = {};
  let specialPotionToggles = {};
  let eventSpecialPotionToggles = {};
  let environmentBuffToggles = {};
  let gamepassToggles = {};
  let eventToggles = {};
  let enchantValues = {};
  let toggleValues = {
    fasterHatchMastery: false,
    dailyPerks: false,
  };
  let numericValues = {
    shrineBlessing: 0,
    dreamerBlessing: 0,
    seasonStars: 0,
    luckierTogether: 0,
    eggsPerHatch: 1,
  };
  let manualStats = {
    luck: 0,
    secretLuck: 1,
    shinyChance: 40,
    mythicChance: 100,
    hatchSpeed: 100,
  };
  let worldIndexStates = {};
  let eventUpgradeValues = {};
  let eggRiftSelections = {};

  $: if ($isDataLoaded) {
    const defaultSelectedOptions = {
      eggs: $dataStore.eggs?.[0]?.id,
      worlds: $dataStore.worlds?.[0]?.id,
      rifts: $dataStore.rifts?.[0]?.id,
      luckyStreak:
        $dataStore.mastery?.luckyStreak?.[
          $dataStore.mastery.luckyStreak.length - 1
        ]?.id,
      ...Object.fromEntries(
        ($dataStore.potions || []).map((potionType) => [
          potionType.id,
          potionType.potions[potionType.potions.length - 1]?.id || [],
        ]),
      ),
      ...Object.fromEntries(
        ($dataStore.eventPotions || []).map((potionType) => [
          potionType.id,
          potionType.potions[potionType.potions.length - 1]?.id || [],
        ]),
      ),
      ...Object.fromEntries(
        ($dataStore.milestones || []).map((milestoneType) => [
          milestoneType.id,
          milestoneType.tiers[milestoneType.tiers.length - 1]?.id || [],
        ]),
      ),
    };
    selectedOptions = { ...defaultSelectedOptions, ...selectedOptions };

    specialPotionToggles = {
      ...Object.fromEntries(
        ($dataStore.specialPotions || []).map((p) => [
          p.id,
          specialPotionToggles[p.id] ?? false,
        ]),
      ),
    };
    eventSpecialPotionToggles = {
      ...Object.fromEntries(
        ($dataStore.eventSpecialPotions || []).map((p) => [
          p.id,
          eventSpecialPotionToggles[p.id] ?? false,
        ]),
      ),
    };
    environmentBuffToggles = {
      ...Object.fromEntries(
        ($dataStore.environmentBuffs || []).map((b) => [
          b.id,
          environmentBuffToggles[b.id] ?? false,
        ]),
      ),
    };
    gamepassToggles = {
      ...Object.fromEntries(
        ($dataStore.gamepasses || []).map((g) => [
          g.id,
          gamepassToggles[g.id] ?? false,
        ]),
      ),
    };
    eventToggles = {
      ...Object.fromEntries(
        ($dataStore.events || []).map((e) => [
          e.id,
          eventToggles[e.id] ?? false,
        ]),
      ),
    };
    enchantValues = {
      ...Object.fromEntries(
        ($dataStore.enchants || []).map((e) => [
          e.id,
          enchantValues[e.id] ?? 0,
        ]),
      ),
    };
  }

  $: selectedEgg = $dataStore.eggs?.find((e) => e.id === selectedOptions.eggs);
  $: isInfinityEgg = selectedEgg?.type === "infinity";
  $: isWorldEgg = selectedEgg?.type === "world";
  $: isRiftableEgg = !!selectedEgg && selectedEgg.riftable === true;

  $: selectedRift =
    $dataStore.rifts?.find((r) => r.id === selectedOptions.rifts) ||
    $dataStore.rifts?.[0];

  $: selectedEggId = selectedOptions.eggs;
  $: selectedWorldId = selectedOptions.worlds;

  $: currentWorldIndexState =
    isWorldEgg && selectedEgg?.world
      ? worldIndexStates[selectedEgg.world] || {
          worldNormal: false,
          worldShiny: false,
        }
      : { worldNormal: false, worldShiny: false };

  $: visibleEventUpgrades = ($dataStore.eventUpgrades || []).filter(
    (u) => selectedEgg?.event && u.event === selectedEgg.event,
  );

  $: {
    if ($isDataLoaded && isUserInputReady) {
      eggsPerHatch = numericValues.eggsPerHatch;

      if (calculationMode === "manual") {
        stats = calculateManualStats(manualStats, [selectedRift]);
      } else if (calculationMode === "calculated") {
        const sources = [
          selectedEgg,
          selectedRift,
          $dataStore.mastery?.luckyStreak?.find(
            (s) => s.id === selectedOptions.luckyStreak,
          ),
          ...($dataStore.potions || [])
            .map((potionType) =>
              potionType.potions.find(
                (p) => p.id === selectedOptions[potionType.id],
              ),
            )
            .filter(Boolean),
          ...($dataStore.eventPotions || [])
            .filter(
              (potionType) =>
                !potionType.event ||
                (selectedEgg?.event && potionType.event === selectedEgg.event),
            )
            .map((potionType) => {
              const selected = potionType.potions.find(
                (p) => p.id === selectedOptions[potionType.id],
              );
              return selected ? { ...selected, event: potionType.event } : null;
            })
            .filter(Boolean),
          ...($dataStore.eventSpecialPotions || []).filter(
            (p) =>
              (!p.event ||
                (selectedEgg?.event && p.event === selectedEgg.event)) &&
              eventSpecialPotionToggles[p.id],
          ),
          ...($dataStore.milestones || [])
            .map((milestoneType) =>
              milestoneType.tiers.find(
                (t) => t.id === selectedOptions[milestoneType.id],
              ),
            )
            .filter(Boolean),
          ...($dataStore.specialPotions || []).filter(
            (p) => specialPotionToggles[p.id],
          ),
          ...($dataStore.environmentBuffs || []).filter(
            (b) => environmentBuffToggles[b.id],
          ),
          ...($dataStore.gamepasses || []).filter((g) => gamepassToggles[g.id]),
          ...($dataStore.events || []).filter((ev) => eventToggles[ev.id]),
          ...($dataStore.enchants || [])
            .map((enchant) => ({
              ...enchant,
              _value: Number(enchantValues[enchant.id]),
            }))
            .filter((e) => e._value > 0),
          ...(selectedEgg?.event ? $dataStore.eventUpgrades || [] : [])
            .filter((upgrade) => upgrade.event === selectedEgg.event)
            .map((upgrade) => {
              let level = Number(eventUpgradeValues[upgrade.id]);
              level = Math.min(level, Object.keys(upgrade.levels).length);

              if (level > 0 && upgrade.levels[level]) {
                return { ...upgrade.levels[level], event: upgrade.event };
              }

              return null;
            })
            .filter(Boolean),
        ].filter(Boolean);

        const toggleValuesWithWorldIndex = {
          ...toggleValues,
          worldNormal: currentWorldIndexState.worldNormal,
          worldShiny: currentWorldIndexState.worldShiny,
        };

        stats = calculateStats(
          sources,
          toggleValuesWithWorldIndex,
          numericValues,
        );
      }
    }
  }

  onMount(async () => {
    if (!$isDataLoaded) {
      await loadData();
    }

    try {
      const savedData = getCookie("hatching-helper-user-input");

      if (savedData && savedData.version === COOKIE_VERSION) {
        calculationMode = savedData.calculationMode || "calculated";
        selectedOptions = {
          ...selectedOptions,
          ...savedData.selectedOptions,
        };
        specialPotionToggles = {
          ...specialPotionToggles,
          ...savedData.specialPotionToggles,
        };
        eventSpecialPotionToggles = {
          ...eventSpecialPotionToggles,
          ...savedData.eventSpecialPotionToggles,
        };
        environmentBuffToggles = {
          ...environmentBuffToggles,
          ...savedData.environmentBuffToggles,
        };
        gamepassToggles = {
          ...gamepassToggles,
          ...savedData.gamepassToggles,
        };
        eventToggles = { ...eventToggles, ...savedData.eventToggles };
        enchantValues = { ...enchantValues, ...savedData.enchantValues };
        toggleValues = { ...toggleValues, ...savedData.toggleValues };
        numericValues = { ...numericValues, ...savedData.numericValues };
        manualStats = { ...manualStats, ...savedData.manualStats };
        worldIndexStates = {
          ...worldIndexStates,
          ...savedData.worldIndexStates,
        };
        eventUpgradeValues = {
          ...eventUpgradeValues,
          ...savedData.eventUpgradeValues,
        };
        eggRiftSelections = {
          ...eggRiftSelections,
          ...savedData.eggRiftSelections,
        };
        dismissedManualWarning = savedData.dismissedManualWarning ?? false;
      } else if (savedData) {
        deleteCookie("hatching-helper-user-input");
      }
    } catch (e) {
      deleteCookie("hatching-helper-user-input");
    }

    isUserInputReady = true;
  });

  function saveToCache() {
    const dataToSave = {
      version: COOKIE_VERSION,
      calculationMode,
      selectedOptions,
      specialPotionToggles,
      eventSpecialPotionToggles,
      environmentBuffToggles,
      gamepassToggles,
      eventToggles,
      enchantValues,
      toggleValues,
      numericValues,
      manualStats,
      worldIndexStates,
      eventUpgradeValues,
      eggRiftSelections,
      dismissedManualWarning,
    };

    setCookie("hatching-helper-user-input", dataToSave);
  }

  function toggleCalculationMode() {
    calculationMode =
      calculationMode === "calculated" ? "manual" : "calculated";
    saveToCache();
  }

  function dismissManualWarning() {
    dismissedManualWarning = true;
    saveToCache();
  }

  function handleSelect({ option, id }) {
    if (id === "eggs") {
      eggRiftSelections = {
        ...eggRiftSelections,
        [selectedOptions.eggs]: selectedOptions.rifts,
      };

      selectedOptions = {
        ...selectedOptions,
        [id]: option.id,
        rifts:
          eggRiftSelections[option.id] || ($dataStore.rifts?.[0]?.id ?? null),
      };
    } else {
      selectedOptions = { ...selectedOptions, [id]: option.id };

      if (id === "rifts") {
        eggRiftSelections = {
          ...eggRiftSelections,
          [selectedOptions.eggs]: option.id,
        };
      }
    }

    saveToCache();
  }

  function updateToggle(toggleData, toggleId) {
    const updated = { ...toggleData, [toggleId]: !toggleData[toggleId] };

    if (toggleData === specialPotionToggles) {
      specialPotionToggles = updated;
    } else if (toggleData === eventSpecialPotionToggles) {
      eventSpecialPotionToggles = updated;
    } else if (toggleData === environmentBuffToggles) {
      environmentBuffToggles = updated;
    } else if (toggleData === gamepassToggles) {
      gamepassToggles = updated;
    } else if (toggleData === eventToggles) {
      eventToggles = updated;
    } else if (toggleData === toggleValues) {
      toggleValues = updated;
    }

    saveToCache();
  }

  function updateNumericValue(numericData, key, value) {
    const updated = { ...numericData, [key]: value };

    if (numericData === numericValues) {
      numericValues = updated;
    } else if (numericData === enchantValues) {
      enchantValues = updated;
    } else if (numericData === eventUpgradeValues) {
      eventUpgradeValues = updated;
    } else if (numericData === manualStats) {
      manualStats = updated;
    }

    saveToCache();
  }

  function updateWorldIndexToggle(key) {
    if (!isWorldEgg || !selectedEgg?.world) {
      return;
    }

    const newState = {
      ...currentWorldIndexState,
      [key]: !currentWorldIndexState[key],
    };

    worldIndexStates = {
      ...worldIndexStates,
      [selectedEgg.world]: newState,
    };

    saveToCache();
  }
</script>

{#if $isDataLoaded && isUserInputReady}
  <div class="user-input">
    <div class="menu-header">
      <h2 class="menu-title">Hatching Settings</h2>
      <button class="mode-toggle-pill" on:click={toggleCalculationMode}>
        <span class="pill-icon">
          {#if calculationMode === "calculated"}
            🧮
          {:else}
            ✏️
          {/if}
        </span>
        <span>{calculationMode === "calculated" ? "Calculated" : "Manual"}</span
        >
      </button>
    </div>

    <div class="menu-container">
      <!-- Egg Selection -->
      <section class="menu-section">
        <div class="menu-row">
          <span class="menu-label">
            <span class="menu-img">
              <SmartImage
                base="assets/images/icons/eggs"
                alt="Eggs"
                size="32px"
                decoding="async"
              />
            </span>
            Egg:
          </span>
          <div class="menu-control">
            <Dropdown
              id="eggs"
              options={$dataStore.eggs || []}
              selectedOption={$dataStore.eggs?.find(
                (e) => e.id === selectedOptions.eggs,
              )}
              onSelect={handleSelect}
            />
          </div>
        </div>

        {#if isInfinityEgg}
          <div class="menu-row">
            <span class="menu-label">
              <span class="menu-img">
                <SmartImage
                  base="assets/images/worlds/the-overworld"
                  alt="World"
                  size="32px"
                  decoding="async"
                />
              </span>
              World:
            </span>
            <div class="menu-control">
              <Dropdown
                id="worlds"
                options={$dataStore.worlds || []}
                selectedOption={$dataStore.worlds?.find(
                  (e) => e.id === selectedOptions.worlds,
                )}
                onSelect={handleSelect}
              />
            </div>
          </div>
        {/if}

        {#if isRiftableEgg}
          <div class="menu-row">
            <span class="menu-label">
              <span class="menu-img">
                <SmartImage
                  base="assets/images/icons/rift"
                  alt="Rift"
                  size="32px"
                  decoding="async"
                />
              </span>
              Rift:
            </span>
            <div class="menu-control">
              <Dropdown
                id="rifts"
                options={$dataStore.rifts || []}
                selectedOption={selectedRift}
                onSelect={handleSelect}
              />
            </div>
          </div>
        {/if}

        {#if isWorldEgg && calculationMode != "manual"}
          <div class="menu-row">
            <span class="menu-label">
              <span class="menu-img">
                <SmartImage
                  base="assets/images/icons/index"
                  alt="Index"
                  size="32px"
                  decoding="async"
                />
              </span>
              Index:
            </span>
            <div class="menu-control world-index-controls">
              <span class="index-label">Normal:</span>
              <Checkbox
                id="world-normal"
                checked={currentWorldIndexState.worldNormal}
                onChange={() => updateWorldIndexToggle("worldNormal")}
              />
              <span class="index-label">Shiny:</span>
              <Checkbox
                id="world-shiny"
                checked={currentWorldIndexState.worldShiny}
                onChange={() => updateWorldIndexToggle("worldShiny")}
              />
            </div>
          </div>
        {/if}
      </section>

      <div class="section-separator"></div>

      <!-- Eggs Per Hatch -->
      <section class="menu-section">
        <div class="menu-row">
          <span class="menu-label">
            <span class="menu-img">
              <SmartImage
                base="assets/images/icons/multi-egg"
                alt="Eggs Per Hatch"
                size="32px"
                decoding="async"
              />
            </span>
            Eggs Per Hatch:
          </span>
          <div class="menu-control">
            <NumberInput
              id="eggs-per-hatch"
              value={numericValues.eggsPerHatch}
              onInput={({ value }) =>
                updateNumericValue(numericValues, "eggsPerHatch", value)}
              hoverText="Amount of eggs opened per hatch"
            />
          </div>
        </div>
      </section>

      <div class="section-separator"></div>

      {#if calculationMode === "manual"}
        <!-- Manual Stats Input -->
        <section class="menu-section">
          <div class="menu-row">
            <span class="menu-label">
              <span class="menu-img">
                <SmartImage
                  base="assets/images/icons/luck"
                  alt="Luck"
                  size="32px"
                  decoding="async"
                />
              </span>
              Luck (%):
            </span>
            <div class="menu-control">
              <NumberInput
                id="manual-luck"
                value={manualStats.luck}
                onInput={({ value }) =>
                  updateNumericValue(manualStats, "luck", value)}
              />
            </div>
          </div>

          <div class="menu-row">
            <span class="menu-label">
              <span class="menu-img">
                <SmartImage
                  base="assets/images/icons/secret-luck"
                  alt="Secret Luck"
                  size="32px"
                  decoding="async"
                />
              </span>
              Secret Luck (x):
            </span>
            <div class="menu-control">
              <NumberInput
                id="manual-secret-luck"
                value={manualStats.secretLuck}
                onInput={({ value }) =>
                  updateNumericValue(manualStats, "secretLuck", value)}
              />
            </div>
          </div>

          <div class="menu-row">
            <span class="menu-label">
              <span class="menu-img">
                <SmartImage
                  base="assets/images/icons/shiny"
                  alt="Shiny Chance"
                  size="32px"
                  decoding="async"
                />
              </span>
              Shiny Chance (1 in):
            </span>
            <div class="menu-control">
              <NumberInput
                id="manual-shiny-chance"
                value={manualStats.shinyChance}
                onInput={({ value }) =>
                  updateNumericValue(manualStats, "shinyChance", value)}
              />
            </div>
          </div>

          <div class="menu-row">
            <span class="menu-label">
              <span class="menu-img">
                <SmartImage
                  base="assets/images/icons/mythic"
                  alt="Mythic Chance"
                  size="32px"
                  decoding="async"
                />
              </span>
              Mythic Chance (1 in):
            </span>
            <div class="menu-control">
              <NumberInput
                id="manual-mythic-chance"
                value={manualStats.mythicChance}
                onInput={({ value }) =>
                  updateNumericValue(manualStats, "mythicChance", value)}
              />
            </div>
          </div>

          <div class="menu-row">
            <span class="menu-label">
              <span class="menu-img">
                <SmartImage
                  base="assets/images/icons/timer"
                  alt="Hatch Speed"
                  size="32px"
                  decoding="async"
                />
              </span>
              Hatch Speed (%):
            </span>
            <div class="menu-control">
              <NumberInput
                id="manual-hatch-speed"
                value={manualStats.hatchSpeed}
                onInput={({ value }) =>
                  updateNumericValue(manualStats, "hatchSpeed", value)}
              />
            </div>
          </div>
        </section>
      {:else}
        <!-- Potions -->
        <section class="menu-section">
          {#each $dataStore.potions || [] as potion (potion.id)}
            <div class="menu-row">
              <span class="menu-label">
                {#if potion.img}
                  <span class="menu-img">
                    <SmartImage
                      base={potion.img}
                      alt={potion.name}
                      size="32px"
                      decoding="async"
                    />
                  </span>
                {/if}
                {potion.name}:
              </span>
              <div class="menu-control">
                <Dropdown
                  id={potion.id}
                  options={potion.potions}
                  selectedOption={potion.potions.find(
                    (o) => o.id === selectedOptions[potion.id],
                  ) || potion.potions[potion.potions.length - 1]}
                  onSelect={handleSelect}
                />
              </div>
            </div>
          {/each}

          {#each $dataStore.eventPotions || [] as potion (potion.id)}
            {#if !potion.event || (selectedEgg?.event && potion.event === selectedEgg.event)}
              <div class="menu-row">
                <span class="menu-label">
                  {#if potion.img}
                    <span class="menu-img">
                      <SmartImage
                        base={potion.img}
                        alt={potion.name}
                        size="32px"
                        decoding="async"
                      />
                    </span>
                  {/if}
                  {potion.name}:
                </span>
                <div class="menu-control">
                  <Dropdown
                    id={potion.id}
                    options={potion.potions}
                    selectedOption={potion.potions.find(
                      (o) => o.id === selectedOptions[potion.id],
                    ) || potion.potions[potion.potions.length - 1]}
                    onSelect={handleSelect}
                  />
                </div>
              </div>
            {/if}
          {/each}

          {#each $dataStore.specialPotions || [] as potion (potion.id)}
            <div class="menu-row">
              <span class="menu-label">
                {#if potion.img}
                  <span class="menu-img">
                    <SmartImage
                      base={potion.img}
                      alt={potion.name}
                      size="32px"
                      decoding="async"
                    />
                  </span>
                {/if}
                {potion.name}:
              </span>
              <div class="menu-control">
                <Checkbox
                  id={potion.id}
                  checked={specialPotionToggles[potion.id]}
                  onChange={() => updateToggle(specialPotionToggles, potion.id)}
                />
              </div>
            </div>
          {/each}
        </section>

        {#each $dataStore.eventSpecialPotions || [] as potion (potion.id)}
          {#if !potion.event || (selectedEgg?.event && potion.event === selectedEgg.event)}
            <div class="menu-row">
              <span class="menu-label">
                {#if potion.img}
                  <span class="menu-img">
                    <SmartImage
                      base={potion.img}
                      alt={potion.name}
                      size="32px"
                      decoding="async"
                    />
                  </span>
                {/if}
                {potion.name}:
              </span>
              <div class="menu-control">
                <Checkbox
                  id={potion.id}
                  checked={eventSpecialPotionToggles[potion.id]}
                  onChange={() =>
                    updateToggle(eventSpecialPotionToggles, potion.id)}
                />
              </div>
            </div>
          {/if}
        {/each}

        <div class="section-separator"></div>

        <!-- Milestones -->
        <section class="menu-section">
          {#each $dataStore.milestones || [] as milestone (milestone.id)}
            <div class="menu-row">
              <span class="menu-label">
                {#if milestone.img}
                  <span class="menu-img">
                    <SmartImage
                      base={milestone.img}
                      alt={milestone.name}
                      size="32px"
                      decoding="async"
                    />
                  </span>
                {/if}
                {milestone.name}:
              </span>
              <div class="menu-control">
                <Dropdown
                  id={milestone.id}
                  options={milestone.tiers}
                  selectedOption={milestone.tiers.find(
                    (o) => o.id === selectedOptions[milestone.id],
                  ) || milestone.tiers[milestone.tiers.length - 1]}
                  onSelect={handleSelect}
                />
              </div>
            </div>
          {/each}
        </section>

        <div class="section-separator"></div>

        <!-- Leveled Buffs -->
        <section class="menu-section">
          <div class="menu-row">
            <span class="menu-label">
              <span class="menu-img">
                <SmartImage
                  base="assets/images/icons/bubble-shrine"
                  alt="Shrine Blessing"
                  size="32px"
                  decoding="async"
                />
              </span>
              Shrine Blessing:
            </span>
            <div class="menu-control">
              <NumberInput
                id="shrine-blessing"
                value={numericValues.shrineBlessing}
                onInput={({ value }) =>
                  updateNumericValue(numericValues, "shrineBlessing", value)}
                hoverText="Bubble Shrine Blessing Level (Max 50)"
              />
            </div>
          </div>

          <div class="menu-row">
            <span class="menu-label">
              <span class="menu-img">
                <SmartImage
                  base="assets/images/icons/dreamer-blessing"
                  alt="Dreamer Blessing"
                  size="32px"
                  decoding="async"
                />
              </span>
              Dreamer Blessing:
            </span>
            <div class="menu-control">
              <NumberInput
                id="dreamer-blessing"
                value={numericValues.dreamerBlessing}
                onInput={({ value }) =>
                  updateNumericValue(numericValues, "dreamerBlessing", value)}
                hoverText="Dreamer Shrine Blessing Level (Max 50)"
              />
            </div>
          </div>

          <div class="menu-row">
            <span class="menu-label">
              <span class="menu-img">
                <SmartImage
                  base="assets/images/icons/season-stars"
                  alt="Season Stars"
                  size="32px"
                  decoding="async"
                />
              </span>
              Season Stars:
            </span>
            <div class="menu-control">
              <NumberInput
                id="season-stars"
                value={numericValues.seasonStars}
                onInput={({ value }) =>
                  updateNumericValue(numericValues, "seasonStars", value)}
                hoverText="Season Pass Stars (Max 1500)"
              />
            </div>
          </div>
        </section>

        <div class="section-separator"></div>

        {#if visibleEventUpgrades.length > 0}
          <section class="menu-section">
            {#each visibleEventUpgrades as upgrade (upgrade.id)}
              <div class="menu-row">
                <span class="menu-label">
                  {#if upgrade.img}
                    <span class="menu-img">
                      <SmartImage
                        base={upgrade.img}
                        alt={upgrade.name}
                        size="32px"
                        decoding="async"
                      />
                    </span>
                  {/if}
                  {upgrade.name}:
                </span>
                <div class="menu-control">
                  <Dropdown
                    id={upgrade.id}
                    options={[
                      { id: 0, name: "None" },
                      ...Object.keys(upgrade.levels || {}).map((l) => ({
                        id: Number(l),
                        name: `Level ${l}`,
                      })),
                    ].sort((a, b) => b.id - a.id)}
                    selectedOption={{
                      id: eventUpgradeValues[upgrade.id] || 0,
                      name: eventUpgradeValues[upgrade.id]
                        ? `Level ${eventUpgradeValues[upgrade.id]}`
                        : "None",
                    }}
                    onSelect={({ option }) =>
                      updateNumericValue(
                        eventUpgradeValues,
                        upgrade.id,
                        option.id,
                      )}
                  />
                </div>
              </div>
            {/each}
          </section>

          <div class="section-separator"></div>
        {/if}

        <!-- Enchants -->
        <section class="menu-section">
          {#each $dataStore.enchants || [] as enchant (enchant.id)}
            <div class="menu-row">
              <span class="menu-label">{enchant.name}:</span>
              <div class="menu-control">
                <NumberInput
                  id={enchant.id}
                  value={enchantValues[enchant.id]}
                  onInput={({ value }) =>
                    updateNumericValue(enchantValues, enchant.id, value)}
                  hoverText="Amount of pets equiped with the {enchant.name} enchant"
                />
              </div>
            </div>
          {/each}
        </section>

        <div class="section-separator"></div>

        <!-- Mastery -->
        <section class="menu-section">
          <div class="menu-row">
            <span class="menu-label">
              <span class="menu-img">
                <SmartImage
                  base="assets/images/icons/lucky-streak"
                  alt="Lucky Streak"
                  size="32px"
                  decoding="async"
                />
              </span>
              Lucky Streak:
            </span>
            <div class="menu-control">
              <Dropdown
                id="luckyStreak"
                options={$dataStore.mastery?.luckyStreak || []}
                selectedOption={$dataStore.mastery?.luckyStreak?.find(
                  (o) => o.id === selectedOptions["luckyStreak"],
                ) ||
                  $dataStore.mastery?.luckyStreak?.[
                    $dataStore.mastery.luckyStreak.length - 1
                  ]}
                onSelect={handleSelect}
              />
            </div>
          </div>

          <div class="menu-row">
            <span class="menu-label">
              <span class="menu-img">
                <SmartImage
                  base="assets/images/icons/luckier-together"
                  alt="Luckier Together"
                  size="32px"
                  decoding="async"
                />
              </span>
              Luckier Together:
            </span>
            <div class="menu-control">
              <NumberInput
                id="luckier-together"
                value={numericValues.luckierTogether}
                onInput={({ value }) =>
                  updateNumericValue(numericValues, "luckierTogether", value)}
                hoverText="Amount of friends in the server"
              />
            </div>
          </div>

          <div class="menu-row">
            <span class="menu-label">
              <span class="menu-img">
                <SmartImage
                  base="assets/images/icons/eggs"
                  alt="Faster Hatch Mastery"
                  size="32px"
                  decoding="async"
                />
              </span>
              Faster Hatch Mastery:
            </span>
            <div class="menu-control">
              <Checkbox
                id="faster-hatch-mastery"
                checked={toggleValues.fasterHatchMastery}
                onChange={() =>
                  updateToggle(toggleValues, "fasterHatchMastery")}
              />
            </div>
          </div>
        </section>

        <div class="section-separator"></div>

        <!-- Environment -->
        <section class="menu-section">
          {#each $dataStore.environmentBuffs || [] as buff (buff.id)}
            <div class="menu-row">
              <span class="menu-label">
                {#if buff.img}
                  <span class="menu-img">
                    <SmartImage
                      base={buff.img}
                      alt={buff.name}
                      size="32px"
                      decoding="async"
                    />
                  </span>
                {/if}
                {buff.name}:
              </span>
              <div class="menu-control">
                <Checkbox
                  id={buff.id}
                  checked={environmentBuffToggles[buff.id]}
                  onChange={() => updateToggle(environmentBuffToggles, buff.id)}
                />
              </div>
            </div>
          {/each}
        </section>

        <div class="section-separator"></div>

        <!-- Paid -->
        <section class="menu-section">
          <div class="menu-row">
            <span class="menu-label">
              <span class="menu-img">
                <SmartImage
                  base="assets/images/icons/daily-perks"
                  alt="Premium Daily Perks"
                  size="32px"
                  decoding="async"
                />
              </span>
              Premium Daily Perks:
            </span>
            <div class="menu-control">
              <Checkbox
                id="daily-perks"
                checked={toggleValues.dailyPerks}
                onChange={() => updateToggle(toggleValues, "dailyPerks")}
              />
            </div>
          </div>

          {#each $dataStore.gamepasses || [] as gamepass (gamepass.id)}
            <div class="menu-row">
              <span class="menu-label">
                {#if gamepass.img}
                  <span class="menu-img">
                    <SmartImage
                      base={gamepass.img}
                      alt={gamepass.name}
                      size="32px"
                      decoding="async"
                    />
                  </span>
                {/if}
                {gamepass.name}:
              </span>
              <div class="menu-control">
                <Checkbox
                  id={gamepass.id}
                  checked={gamepassToggles[gamepass.id]}
                  onChange={() => updateToggle(gamepassToggles, gamepass.id)}
                />
              </div>
            </div>
          {/each}
        </section>

        <div class="section-separator"></div>

        <!-- Events -->
        <section class="menu-section">
          {#each $dataStore.events || [] as event (event.id)}
            <div class="menu-row">
              <span class="menu-label">
                {#if event.img}
                  <span class="menu-img">
                    <SmartImage
                      base={event.img}
                      alt={event.name}
                      size="32px"
                      decoding="async"
                    />
                  </span>
                {/if}
                {event.name}:
              </span>
              <div class="menu-control">
                <Checkbox
                  id={event.id}
                  checked={eventToggles[event.id]}
                  onChange={() => updateToggle(eventToggles, event.id)}
                />
              </div>
            </div>
          {/each}
        </section>
      {/if}
    </div>

    {#if calculationMode === "manual" && selectedEgg?.event === "none" && !dismissedManualWarning}
      <WarningBanner
        type="warning"
        title="Debug stats may be inaccurate!"
        items={[
          {
            label: "World Index",
            description:
              "Shown in debug stats for all eggs; only affects world eggs",
          },
          {
            label: "Secret Pets Milestone",
            description: "Secret luck bonus not shown in debug stats",
          },
          {
            label: "Rounded Values",
            description: "Shiny and mythic stats are rounded and not exact",
          },
        ]}
        recommendation="Use Calculated mode for more accurate results"
        onDismiss={dismissManualWarning}
      />
    {/if}
  </div>
{/if}

<style>
  .user-input {
    background: var(--menu-bg);
    padding: 1.5rem;
    border-radius: var(--radius-md);
    box-shadow: var(--elevation);
    border: 1.5px solid var(--border);
    position: relative;
    max-width: min-content;
  }

  .menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .menu-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--primary-text);
  }

  .mode-toggle-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--menu-bg);
    border: 1.5px solid var(--border);
    border-radius: 16px;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--secondary-text);
  }

  .mode-toggle-pill:hover {
    background: color-mix(in srgb, var(--accent) 5%, var(--menu-bg));
  }

  .pill-icon {
    font-size: 1rem;
    line-height: 1;
  }

  .menu-container,
  .menu-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .menu-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    padding: 0.25rem 0;
    transition: background-color 0.2s ease;
    border-radius: var(--radius-md);
  }

  .menu-row:hover {
    background-color: color-mix(in srgb, var(--accent) 5%, transparent);
  }

  .menu-label {
    color: var(--primary-text);
    font-size: 1.05rem;
    font-weight: 500;
    flex: 1 1 0;
    white-space: nowrap;
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .menu-control {
    display: flex;
    justify-content: flex-end;
    min-width: 120px;
  }

  .section-separator {
    border-bottom: 1.5px solid var(--border);
    margin: 0.5rem 0;
    opacity: 0.6;
  }

  .menu-img {
    margin-right: 0.75rem;
    flex-shrink: 0;
  }

  .world-index-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .index-label {
    color: var(--primary-text);
    font-size: 1.05rem;
    font-weight: 500;
    white-space: nowrap;
  }
</style>
