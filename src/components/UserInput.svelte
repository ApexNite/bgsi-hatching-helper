<script>
    import { calculateStats, calculateManualStats } from "../lib/statUtils.js";
    import { setCookie, getCookie, deleteCookie } from "../lib/cookieUtils.js";
    import { onMount } from "svelte";

    import Dropdown from "./form/Dropdown.svelte";
    import Checkbox from "./form/Checkbox.svelte";
    import NumberInput from "./form/NumberInput.svelte";

    import {
        dailyPerks,
        eggs,
        enchants,
        environmentBuffs,
        events,
        gamepasses,
        halloweenUpgrades,
        index,
        mastery,
        milestones,
        potions,
        rifts,
        specialPotions,
        worlds
    } from "../lib/dataUtils.js";

    export let stats;
    export let eggsPerHatch;
    export let selectedEggId;
    export let selectedWorldId;

    const COOKIE_VERSION = 2;

    let calculationMode = 'calculated';

    const defaultManualStats = {
        luck: 0,
        secretLuck: 1, 
        shinyChance: 40,
        mythicChance: 100,
        hatchSpeed: 100
    };

    const defaultSelectedOptions = {
        eggs: eggs[0]?.id,
        worlds: worlds[0]?.id,
        rifts: rifts[0]?.id,
        luckyStreak: mastery.luckyStreak[mastery.luckyStreak.length - 1]?.id,
        ...Object.fromEntries(
            potions.map((potionType) => [potionType.id, potionType.potions[potionType.potions.length - 1]?.id || []])
        ),
        ...Object.fromEntries(
            milestones.map((milestoneType) => [milestoneType.id, milestoneType.tiers[milestoneType.tiers.length - 1]?.id || []])
        )
    };

    const defaultSpecialPotionToggles = Object.fromEntries(specialPotions.map((p) => [p.id, false]));
    const defaultEnvironmentBuffToggles = Object.fromEntries(environmentBuffs.map((b) => [b.id, false]));
    const defaultGamepassToggles = Object.fromEntries(gamepasses.map((g) => [g.id, false]));
    const defaultEventToggles = Object.fromEntries(events.map((e) => [e.id, false]));
    const defaultEnchantValues = Object.fromEntries(enchants.map((e) => [e.id, 0]));
    const defaultToggleValues = {
        fasterHatchMastery: false,
        dailyPerks: false
    };
    const defaultNumericValues = {
        shrineBlessing: 0,
        dreamerBlessing: 0,
        seasonStars: 0,
        luckierTogether: 0,
        eggsPerHatch: 1
    };
    const defaultWorldIndexStates = {};
    const defaultHalloweenUpgradeValues = {};

    let selectedOptions = defaultSelectedOptions;
    let specialPotionToggles = defaultSpecialPotionToggles;
    let environmentBuffToggles = defaultEnvironmentBuffToggles;
    let gamepassToggles = defaultGamepassToggles;
    let eventToggles = defaultEventToggles;
    let enchantValues = defaultEnchantValues;
    let toggleValues = defaultToggleValues;
    let numericValues = defaultNumericValues;
    let manualStats = defaultManualStats;
    let worldIndexStates = defaultWorldIndexStates;
    let halloweenUpgradeValues = defaultHalloweenUpgradeValues;

    let dismissedManualWarning = false;

    $: selectedEgg = eggs?.find((e) => e.id === selectedOptions.eggs);
    $: isInfinityEgg = selectedEgg?.type === "infinity";
    $: isWorldEgg = selectedEgg?.type === "world";
    $: isRiftableEgg = !!selectedEgg && selectedEgg.riftable === true;
    $: isHalloweenEgg = selectedEgg?.event === "halloween";

    $: selectedRift = rifts?.find((r) => r.id === selectedOptions.rifts) || rifts?.[0];

    $: selectedEggId = selectedOptions.eggs;
    $: selectedWorldId = selectedOptions.worlds;

    $: currentWorldIndexState = isWorldEgg && selectedEgg?.world 
        ? (worldIndexStates[selectedEgg.world] || { worldNormal: false, worldShiny: false })
        : { worldNormal: false, worldShiny: false };

    $: {
        eggsPerHatch = numericValues.eggsPerHatch;

        if (calculationMode === 'manual') {
            stats = calculateManualStats(manualStats, selectedRift);
        } else {
            const sources = [
                selectedEgg,
                selectedRift,
                mastery?.luckyStreak?.find((s) => s.id === selectedOptions.luckyStreak),
                ...(potions || [])
                    .filter((potionType) => 
                        !potionType.event || (selectedEgg.event && potionType.event === selectedEgg.event)
                    )
                    .map((potionType) => potionType.potions.find((p) => p.id === selectedOptions[potionType.id]))
                    .filter(Boolean),
                ...(milestones || [])
                    .map((milestoneType) => milestoneType.tiers.find((t) => t.id === selectedOptions[milestoneType.id]))
                    .filter(Boolean),
                ...(specialPotions || []).filter((p) => specialPotionToggles[p.id]),
                ...(environmentBuffs || []).filter((b) => environmentBuffToggles[b.id]),
                ...(gamepasses || []).filter((g) => gamepassToggles[g.id]),
                ...(events || []).filter((ev) => eventToggles[ev.id]),
                ...(enchants || [])
                    .map((enchant) => ({ ...enchant, _value: Number(enchantValues[enchant.id]) }))
                    .filter((e) => e._value > 0),
                ...(halloweenUpgrades || [])
                    .map((upgrade) => {
                        let level = Number(halloweenUpgradeValues[upgrade.id]);
                        level = Math.min(level, Object.keys(upgrade.levels).length);

                        if (level > 0 && upgrade.levels[level]) {
                            return { ...upgrade.levels[level] };
                        }

                        return null;
                    })
                    .filter(Boolean)
            ].filter(Boolean);

            const toggleValuesWithWorldIndex = { 
                ...toggleValues, 
                worldNormal: currentWorldIndexState.worldNormal,
                worldShiny: currentWorldIndexState.worldShiny
            };

            stats = calculateStats(sources, toggleValuesWithWorldIndex, numericValues, dailyPerks, index, mastery);
        }
    }

    onMount(() => {
        try {
            const savedData = getCookie('hatching-helper-user-input');

            if (savedData && savedData.version === COOKIE_VERSION) {
                calculationMode = savedData.calculationMode || 'calculated';
                selectedOptions = { ...defaultSelectedOptions, ...savedData.selectedOptions };
                specialPotionToggles = { ...defaultSpecialPotionToggles, ...savedData.specialPotionToggles };
                environmentBuffToggles = { ...defaultEnvironmentBuffToggles, ...savedData.environmentBuffToggles };
                gamepassToggles = { ...defaultGamepassToggles, ...savedData.gamepassToggles };
                eventToggles = { ...defaultEventToggles, ...savedData.eventToggles };
                enchantValues = { ...defaultEnchantValues, ...savedData.enchantValues };
                toggleValues = { ...defaultToggleValues, ...savedData.toggleValues };
                numericValues = { ...defaultNumericValues, ...savedData.numericValues };
                manualStats = { ...defaultManualStats, ...savedData.manualStats };
                worldIndexStates = { ...defaultWorldIndexStates, ...savedData.worldIndexStates };
                halloweenUpgradeValues = { ...defaultHalloweenUpgradeValues, ...savedData.halloweenUpgradeValues };
                dismissedManualWarning = savedData.dismissedManualWarning ?? false;
            } else if (savedData) {
                deleteCookie('hatching-helper-user-input');
            }
        } catch (e) {
            deleteCookie('hatching-helper-user-input');
        }
    });

    function saveToCache() {
        const dataToSave = {
            version: COOKIE_VERSION,
            calculationMode,
            selectedOptions,
            specialPotionToggles,
            environmentBuffToggles,
            gamepassToggles,
            eventToggles,
            enchantValues,
            toggleValues,
            numericValues,
            manualStats,
            worldIndexStates,
            halloweenUpgradeValues,
            dismissedManualWarning
        };

        setCookie('hatching-helper-user-input', dataToSave);
    }

    function toggleCalculationMode() {
        calculationMode = calculationMode === 'calculated' ? 'manual' : 'calculated';
        saveToCache();
    }

    function dismissWarning() {
        dismissedManualWarning = true;
        saveToCache();
    }

    function updateManualStat(key, value) {
        manualStats = { ...manualStats, [key]: value };
        saveToCache();
    }

    function handleSelect({ option, id }) {
        if (id === "eggs") {
            selectedOptions = { ...selectedOptions, [id]: option.id, rifts: rifts?.[0]?.id ?? null };
        } else {
            selectedOptions = { ...selectedOptions, [id]: option.id };
        }
        saveToCache();
    }

    function updateSpecialPotionToggle(potionId) {
        specialPotionToggles = { ...specialPotionToggles, [potionId]: !specialPotionToggles[potionId] };
        saveToCache();
    }

    function updateEnvironmentBuffToggle(buffId) {
        environmentBuffToggles = { ...environmentBuffToggles, [buffId]: !environmentBuffToggles[buffId] };
        saveToCache();
    }

    function updateGamepassToggle(gamepassId) {
        gamepassToggles = { ...gamepassToggles, [gamepassId]: !gamepassToggles[gamepassId] };
        saveToCache();
    }

    function updateEventToggle(eventId) {
        eventToggles = { ...eventToggles, [eventId]: !eventToggles[eventId] };
        saveToCache();
    }

    function updateGameplayToggle(key) {
        toggleValues = { ...toggleValues, [key]: !toggleValues[key] };
        saveToCache();
    }

    function updateNumericValue(key, value) {
        numericValues = { ...numericValues, [key]: value };
        saveToCache();
    }

    function updateEnchantValue(enchantId, value) {
        enchantValues = { ...enchantValues, [enchantId]: value };
        saveToCache();
    }

    function updateWorldIndexToggle(key) {
        if (!isWorldEgg || !selectedEgg?.world) {
            return;
        }

        const newState = {
            ...currentWorldIndexState,
            [key]: !currentWorldIndexState[key]
        };
        
        worldIndexStates = {
            ...worldIndexStates,
            [selectedEgg.world]: newState
        };
        
        saveToCache();
    }

    function updateHalloweenUpgradeValue(upgradeId, value) {
        halloweenUpgradeValues = { ...halloweenUpgradeValues, [upgradeId]: value };
        saveToCache();
    }
</script>

<div class="user-input">
    <div class="menu-header">
        <h2 class="menu-title">Hatching Settings</h2>
        <button class="mode-toggle-pill" on:click={toggleCalculationMode}>
            <span class="pill-icon">
                {#if calculationMode === 'calculated'}
                    🧮
                {:else}
                    ✏️
                {/if}
            </span>
            <span>{calculationMode === 'calculated' ? 'Calculated' : 'Manual'}</span>
        </button>
    </div>

    <div class="menu-container">
        <!-- Egg Selection -->
        <section class="menu-section">
            <div class="menu-row">
                <span class="menu-label">
                    <picture>
                        <source srcset="assets/images/icons/eggs.avif" type="image/avif">
                        <source srcset="assets/images/icons/eggs.webp" type="image/webp">
                        <img src="assets/images/icons/eggs.png" alt="Eggs" class="menu-img" loading="lazy" decoding="async">
                    </picture>
                    Egg:
                </span>
                <div class="menu-control">
                    <Dropdown
                        id="eggs"
                        options={eggs || []}
                        selectedOption={eggs?.find((e) => e.id === selectedOptions.eggs)}
                        onSelect={handleSelect}
                    />
                </div>
            </div>

            {#if isInfinityEgg}
                <div class="menu-row">
                    <span class="menu-label">
                        <picture>
                            <source srcset="assets/images/worlds/the-overworld.avif" type="image/avif">
                            <source srcset="assets/images/worlds/the-overworld.webp" type="image/webp">
                            <img src="assets/images/worlds/the-overworld.png" alt="World" class="menu-img" loading="lazy" decoding="async">
                        </picture>
                        World:
                    </span>
                    <div class="menu-control">
                        <Dropdown
                            id="worlds"
                            options={worlds || []}
                            selectedOption={worlds?.find((e) => e.id === selectedOptions.worlds)}
                            onSelect={handleSelect}
                        />
                    </div>
                </div>
            {/if}

            {#if isRiftableEgg}
                <div class="menu-row">
                    <span class="menu-label">
                        <picture>
                            <source srcset="assets/images/icons/rift.avif" type="image/avif">
                            <source srcset="assets/images/icons/rift.webp" type="image/webp">
                            <img src="assets/images/icons/rift.png" alt="Rift" class="menu-img" loading="lazy" decoding="async">
                        </picture>
                        Rift:
                    </span>
                    <div class="menu-control">
                        <Dropdown id="rifts" options={rifts || []} selectedOption={selectedRift} onSelect={handleSelect} />
                    </div>
                </div>
            {/if}

            {#if isWorldEgg && calculationMode != "manual"}
                <div class="menu-row">
                    <span class="menu-label">
                        <picture>
                            <source srcset="assets/images/icons/index.avif" type="image/avif">
                            <source srcset="assets/images/icons/index.webp" type="image/webp">
                            <img src="assets/images/icons/index.png" alt="Index" class="menu-img" loading="lazy" decoding="async">
                        </picture>
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
                    <picture>
                        <source srcset="assets/images/icons/multi-egg.avif" type="image/avif">
                        <source srcset="assets/images/icons/multi-egg.webp" type="image/webp">
                        <img src="assets/images/icons/multi-egg.png" alt="Eggs Per Hatch" class="menu-img" loading="lazy" decoding="async">
                    </picture>
                    Eggs Per Hatch:
                </span>
                <div class="menu-control">
                    <NumberInput
                        id="eggs-per-hatch"
                        value={numericValues.eggsPerHatch}
                        onInput={({ value }) => updateNumericValue("eggsPerHatch", value)}
                        hoverText="Amount of Eggs Opened Per Hatch"
                    />
                </div>
            </div>
        </section>

        <div class="section-separator"></div>

        {#if calculationMode === 'manual'}
            <!-- Manual Stats Input -->
            <section class="menu-section">
                <div class="menu-row">
                    <span class="menu-label">
                        <picture>
                            <source srcset="assets/images/icons/luck.avif" type="image/avif">
                            <source srcset="assets/images/icons/luck.webp" type="image/webp">
                            <img src="assets/images/icons/luck.png" alt="Luck" class="menu-img" loading="lazy" decoding="async">
                        </picture>
                        Luck (%):
                    </span>
                    <div class="menu-control">
                        <NumberInput
                            id="manual-luck"
                            value={manualStats.luck}
                            onInput={({ value }) => updateManualStat("luck", value)}
                        />
                    </div>
                </div>

                <div class="menu-row">
                    <span class="menu-label">
                        <picture>
                            <source srcset="assets/images/icons/secret-luck.avif" type="image/avif">
                            <source srcset="assets/images/icons/secret-luck.webp" type="image/webp">
                            <img src="assets/images/icons/secret-luck.png" alt="Secret Luck" class="menu-img" loading="lazy" decoding="async">
                        </picture>
                        Secret Luck (x):
                    </span>
                    <div class="menu-control">
                        <NumberInput
                            id="manual-secret-luck"
                            value={manualStats.secretLuck}
                            onInput={({ value }) => updateManualStat("secretLuck", value)}
                        />
                    </div>
                </div>

                <div class="menu-row">
                    <span class="menu-label">
                        <picture>
                            <source srcset="assets/images/icons/shiny.avif" type="image/avif">
                            <source srcset="assets/images/icons/shiny.webp" type="image/webp">
                            <img src="assets/images/icons/shiny.png" alt="Shiny Chance" class="menu-img" loading="lazy" decoding="async">
                        </picture>
                        Shiny Chance (1 in):
                    </span>
                    <div class="menu-control">
                        <NumberInput
                            id="manual-shiny-chance"
                            value={manualStats.shinyChance}
                            onInput={({ value }) => updateManualStat("shinyChance", value)}
                        />
                    </div>
                </div>

                <div class="menu-row">
                    <span class="menu-label">
                        <picture>
                            <source srcset="assets/images/icons/mythic.avif" type="image/avif">
                            <source srcset="assets/images/icons/mythic.webp" type="image/webp">
                            <img src="assets/images/icons/mythic.png" alt="Mythic Chance" class="menu-img" loading="lazy" decoding="async">
                        </picture>
                        Mythic Chance (1 in):
                    </span>
                    <div class="menu-control">
                        <NumberInput
                            id="manual-mythic-chance"
                            value={manualStats.mythicChance}
                            onInput={({ value }) => updateManualStat("mythicChance", value)}
                        />
                    </div>
                </div>

                <div class="menu-row">
                    <span class="menu-label">
                        <picture>
                            <source srcset="assets/images/icons/timer.avif" type="image/avif">
                            <source srcset="assets/images/icons/timer.webp" type="image/webp">
                            <img src="assets/images/icons/timer.png" alt="Hatch Speed" class="menu-img" loading="lazy" decoding="async">
                        </picture>
                        Hatch Speed (%):
                    </span>
                    <div class="menu-control">
                        <NumberInput
                            id="manual-hatch-speed"
                            value={manualStats.hatchSpeed}
                            onInput={({ value }) => updateManualStat("hatchSpeed", value)}
                        />
                    </div>
                </div>
            </section>
        {:else}
            <!-- Potions -->
            <section class="menu-section">
                {#each potions || [] as potion (potion.id)}
                    {#if !potion.event || (selectedEgg.event && potion.event === selectedEgg.event)}
                        <div class="menu-row">
                            <span class="menu-label">
                                {#if potion.img}
                                    <picture>
                                        <source srcset="{potion.img}.avif" type="image/avif">
                                        <source srcset="{potion.img}.webp" type="image/webp">
                                        <img src="{potion.img}.png" alt={potion.name} class="menu-img" loading="lazy" decoding="async">
                                    </picture>
                                {/if}
                                {potion.name}:
                            </span>
                            <div class="menu-control">
                                <Dropdown
                                    id={potion.id}
                                    options={potion.potions}
                                    selectedOption={potion.potions.find((o) => o.id === selectedOptions[potion.id]) || potion.potions[potion.potions.length - 1]}
                                    onSelect={handleSelect}
                                />
                            </div>
                        </div>
                    {/if}
                {/each}

                {#each specialPotions || [] as potion (potion.id)}
                    <div class="menu-row">
                        <span class="menu-label">
                            {#if potion.img}
                                <picture>
                                    <source srcset="{potion.img}.avif" type="image/avif">
                                    <source srcset="{potion.img}.webp" type="image/webp">
                                    <img src="{potion.img}.png" alt={potion.name} class="menu-img" loading="lazy" decoding="async">
                                </picture>
                            {/if}
                            {potion.name}:
                        </span>
                        <div class="menu-control">
                            <Checkbox
                                id={potion.id}
                                checked={specialPotionToggles[potion.id]}
                                onChange={() => updateSpecialPotionToggle(potion.id)}
                            />
                        </div>
                    </div>
                {/each}
            </section>

            <div class="section-separator"></div>

            <!-- Milestones -->
            <section class="menu-section">
                {#each milestones || [] as milestone (milestone.id)}
                    <div class="menu-row">
                        <span class="menu-label">
                            {#if milestone.img}
                                <picture>
                                    <source srcset="{milestone.img}.avif" type="image/avif">
                                    <source srcset="{milestone.img}.webp" type="image/webp">
                                    <img src="{milestone.img}.png" alt={milestone.name} class="menu-img" loading="lazy" decoding="async">
                                </picture>
                            {/if}
                            {milestone.name}:
                        </span>
                        <div class="menu-control">
                            <Dropdown
                                id={milestone.id}
                                options={milestone.tiers}
                                selectedOption={milestone.tiers.find((o) => o.id === selectedOptions[milestone.id]) || milestone.tiers[milestone.tiers.length - 1]}
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
                        <picture>
                            <source srcset="assets/images/icons/bubble-shrine.avif" type="image/avif">
                            <source srcset="assets/images/icons/bubble-shrine.webp" type="image/webp">
                            <img src="assets/images/icons/bubble-shrine.png" alt="Shrine Blessing" class="menu-img" loading="lazy" decoding="async">
                        </picture>
                        Shrine Blessing:
                    </span>
                    <div class="menu-control">
                        <NumberInput
                            id="shrine-blessing"
                            value={numericValues.shrineBlessing}
                            onInput={({ value }) => updateNumericValue("shrineBlessing", value)}
                            hoverText="Bubble Shrine Blessing Level (Max 50)"
                        />
                    </div>
                </div>

                <div class="menu-row">
                    <span class="menu-label">
                        <picture>
                            <source srcset="assets/images/icons/dreamer-blessing.avif" type="image/avif">
                            <source srcset="assets/images/icons/dreamer-blessing.webp" type="image/webp">
                            <img src="assets/images/icons/dreamer-blessing.png" alt="Dreamer Blessing" class="menu-img" loading="lazy" decoding="async">
                        </picture>
                        Dreamer Blessing:
                    </span>
                    <div class="menu-control">
                        <NumberInput
                            id="dreamer-blessing"
                            value={numericValues.dreamerBlessing}
                            onInput={({ value }) => updateNumericValue("dreamerBlessing", value)}
                            hoverText="Dreamer Shrine Blessing Level (Max 50)"
                        />
                    </div>
                </div>

                <div class="menu-row">
                    <span class="menu-label">
                        <picture>
                            <source srcset="assets/images/icons/season-stars.avif" type="image/avif">
                            <source srcset="assets/images/icons/season-stars.webp" type="image/webp">
                            <img src="assets/images/icons/season-stars.png" alt="Season Stars" class="menu-img" loading="lazy" decoding="async">
                        </picture>
                        Season Stars:
                    </span>
                    <div class="menu-control">
                        <NumberInput
                            id="season-stars"
                            value={numericValues.seasonStars}
                            onInput={({ value }) => updateNumericValue("seasonStars", value)}
                            hoverText="Infinite Track Season Pass Stars (Max 1500)"
                        />
                    </div>
                </div>
            </section>
            
            {#if isHalloweenEgg && calculationMode !== "manual"}
                <div class="section-separator"></div>

                <!-- Halloween Upgrades -->
                <section class="menu-section">
                    {#each halloweenUpgrades || [] as upgrade (upgrade.id)}
                        <div class="menu-row">
                            <span class="menu-label">
                                {#if upgrade.img}
                                    <picture>
                                        <source srcset="{upgrade.img}.avif" type="image/avif">
                                        <source srcset="{upgrade.img}.webp" type="image/webp">
                                        <img src="{upgrade.img}.png" alt={upgrade.name} class="menu-img" loading="lazy" decoding="async">
                                    </picture>
                                {/if}
                                {upgrade.name}:
                            </span>
                            <div class="menu-control">
                                <NumberInput
                                    id={upgrade.id}
                                    value={halloweenUpgradeValues[upgrade.id]}
                                    onInput={({ value }) => updateHalloweenUpgradeValue(upgrade.id, value)}
                                    hoverText={upgrade.hoverText}
                                />
                            </div>
                        </div>
                    {/each}
                </section>
            {/if}

            <div class="section-separator"></div>

            <!-- Enchants -->
            <section class="menu-section">
                {#each enchants || [] as enchant (enchant.id)}
                    <div class="menu-row">
                        <span class="menu-label">{enchant.name}:</span>
                        <div class="menu-control">
                            <NumberInput
                                id={enchant.id}
                                value={enchantValues[enchant.id]}
                                onInput={({ value }) => updateEnchantValue(enchant.id, value)}
                                hoverText="Amount of Pets Equiped with the {enchant.name} Enchant"
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
                        <picture>
                            <source srcset="assets/images/icons/lucky-streak.avif" type="image/avif">
                            <source srcset="assets/images/icons/lucky-streak.webp" type="image/webp">
                            <img src="assets/images/icons/lucky-streak.png" alt="Lucky Streak" class="menu-img" loading="lazy" decoding="async">
                        </picture>
                        Lucky Streak:
                    </span>
                    <div class="menu-control">
                        <Dropdown
                            id="luckyStreak"
                            options={mastery?.luckyStreak || []}
                            selectedOption={mastery?.luckyStreak?.find((o) => o.id === selectedOptions["luckyStreak"]) || mastery?.luckyStreak?.[mastery.luckyStreak.length - 1]}
                            onSelect={handleSelect}
                        />
                    </div>
                </div>

                <div class="menu-row">
                    <span class="menu-label">
                        <picture>
                            <source srcset="assets/images/icons/luckier-together.avif" type="image/avif">
                            <source srcset="assets/images/icons/luckier-together.webp" type="image/webp">
                            <img src="assets/images/icons/luckier-together.png" alt="Luckier Together" class="menu-img" loading="lazy" decoding="async">
                        </picture>
                        Luckier Together:
                    </span>
                    <div class="menu-control">
                        <NumberInput
                            id="luckier-together"
                            value={numericValues.luckierTogether}
                            onInput={({ value }) => updateNumericValue("luckierTogether", value)}
                            hoverText="Amount of Friends in the server"
                        />
                    </div>
                </div>

                <div class="menu-row">
                    <span class="menu-label">
                        <picture>
                            <source srcset="assets/images/icons/eggs.avif" type="image/avif">
                            <source srcset="assets/images/icons/eggs.webp" type="image/webp">
                            <img src="assets/images/icons/eggs.png" alt="Faster Hatch Mastery" class="menu-img" loading="lazy" decoding="async">
                        </picture>
                        Faster Hatch Mastery:
                    </span>
                    <div class="menu-control">
                        <Checkbox
                            id="faster-hatch-mastery"
                            checked={toggleValues.fasterHatchMastery}
                            onChange={() => updateGameplayToggle("fasterHatchMastery")}
                        />
                    </div>
                </div>
            </section>

            <div class="section-separator"></div>

            <!-- Environment -->
            <section class="menu-section">
                {#each environmentBuffs || [] as buff (buff.id)}
                    <div class="menu-row">
                        <span class="menu-label">
                            {#if buff.img}
                                <picture>
                                    <source srcset="{buff.img}.avif" type="image/avif">
                                    <source srcset="{buff.img}.webp" type="image/webp">
                                    <img src="{buff.img}.png" alt={buff.name} class="menu-img" loading="lazy" decoding="async">
                                </picture>
                            {/if}
                            {buff.name}:
                        </span>
                        <div class="menu-control">
                            <Checkbox
                                id={buff.id}
                                checked={environmentBuffToggles[buff.id]}
                                onChange={() => updateEnvironmentBuffToggle(buff.id)}
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
                        <picture>
                            <source srcset="assets/images/icons/daily-perks.avif" type="image/avif">
                            <source srcset="assets/images/icons/daily-perks.webp" type="image/webp">
                            <img src="assets/images/icons/daily-perks.png" alt="Premium Daily Perks" class="menu-img" loading="lazy" decoding="async">
                        </picture>
                        Premium Daily Perks:
                    </span>
                    <div class="menu-control">
                        <Checkbox
                            id="daily-perks"
                            checked={toggleValues.dailyPerks}
                            onChange={() => updateGameplayToggle("dailyPerks")}
                        />
                    </div>
                </div>

                {#each gamepasses || [] as gamepass (gamepass.id)}
                    <div class="menu-row">
                        <span class="menu-label">
                            {#if gamepass.img}
                                <picture>
                                    <source srcset="{gamepass.img}.avif" type="image/avif">
                                    <source srcset="{gamepass.img}.webp" type="image/webp">
                                    <img src="{gamepass.img}.png" alt={gamepass.name} class="menu-img" loading="lazy" decoding="async">
                                </picture>
                            {/if}
                            {gamepass.name}:
                        </span>
                        <div class="menu-control">
                            <Checkbox
                                id={gamepass.id}
                                checked={gamepassToggles[gamepass.id]}
                                onChange={() => updateGamepassToggle(gamepass.id)}
                            />
                        </div>
                    </div>
                {/each}
            </section>

            <div class="section-separator"></div>

            <!-- Events -->
            <section class="menu-section">
                {#each events || [] as event (event.id)}
                    <div class="menu-row">
                        <span class="menu-label">
                            {#if event.img}
                                <picture>
                                    <source srcset="{event.img}.avif" type="image/avif">
                                    <source srcset="{event.img}.webp" type="image/webp">
                                    <img src="{event.img}.png" alt={event.name} class="menu-img" loading="lazy" decoding="async">
                                </picture>
                            {/if}
                            {event.name}:
                        </span>
                        <div class="menu-control">
                            <Checkbox
                                id={event.id}
                                checked={eventToggles[event.id]}
                                onChange={() => updateEventToggle(event.id)}
                            />
                        </div>
                    </div>
                {/each}
            </section>
        {/if}
    </div>

    {#if calculationMode === 'manual' && !dismissedManualWarning}
        <div class="warning-banner">
            <span class="warning-icon">⚠️</span>
            <p class="warning-text">
                Debug stats may not reflect actual values!
            </p>
            <button class="warning-dismiss" on:click={dismissWarning}>✕</button>
        </div>
    {/if}
</div>

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
        margin: 1rem 0;
        opacity: 0.6;
    }

    .menu-img {
        margin-right: 0.75rem;
        width: 32px;
        height: 32px;
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

    .warning-banner {
        background: rgba(255, 255, 0, 0.1);
        border: 1px solid rgba(255, 255, 0, 0.3);
        border-radius: var(--radius-md);
        padding: 1rem;
        margin-top: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .warning-icon {
        font-size: 1.5rem;
        line-height: 1;
    }

    .warning-text {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 500;
        flex: 1;
    }

    .warning-dismiss {
        background: rgba(255, 255, 0, 0.1);
        border: none;
        color: var(--primary-text);
        cursor: pointer;
        width: 28px;
        height: 28px;
        border-radius: var(--radius-md);
        font-size: 0.95rem;
        line-height: 1;
        transition: background-color 0.2s ease;
    }

    .warning-dismiss:hover {
        background: rgba(255, 255, 0, 0.15);
    }

    .warning-dismiss:active {
        transform: scale(0.97);
        background: rgba(255, 255, 0, 0.2);
    }
</style>
