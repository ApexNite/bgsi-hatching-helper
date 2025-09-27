<script>
    import { calculateStats } from "../lib/statUtils.js";

    import Dropdown from "./form/Dropdown.svelte";
    import Checkbox from "./form/Checkbox.svelte";
    import NumberInput from "./form/NumberInput.svelte";

    import {
        eggs,
        enchants,
        environmentBuffs,
        events,
        gamepasses,
        mastery,
        milestones,
        potions,
        rifts,
        specialPotions,
        worlds,
        dailyPerks,
        index
    } from "../stores.js";

    export let stats = { luck: 1, secretLuck: 1, shinyChance: 1 / 40, mythicChance: 1 / 100, hatchSpeed: 1, eggsPerHatch: 1 };
    export let selectedEggId = null;
    export let selectedWorldId = null;

    let selectedOptions = {
        eggs: null,
        worlds: null,
        rifts: null,
        luckyStreak: null
    };

    $: if ($eggs && selectedOptions.eggs == null) {
        selectedOptions = { ...selectedOptions, eggs: $eggs[0]?.id ?? null };
    }
    $: if ($worlds && selectedOptions.worlds == null) {
        selectedOptions = { ...selectedOptions, worlds: $worlds[0]?.id ?? null };
    }
    $: if ($rifts && selectedOptions.rifts == null) {
        selectedOptions = { ...selectedOptions, rifts: $rifts[0]?.id ?? null };
    }
    $: if ($mastery?.luckyStreak && selectedOptions.luckyStreak == null) {
        const arr = $mastery.luckyStreak;
        selectedOptions = { ...selectedOptions, luckyStreak: arr[arr.length - 1]?.id ?? null };
    }
    $: if ($potions?.length) {
        const updates = {};
        for (const potionType of $potions) {
            if (selectedOptions[potionType.id] == null) {
                const last = potionType.potions?.[potionType.potions.length - 1];
                updates[potionType.id] = last?.id ?? null;
            }
        }
        if (Object.keys(updates).length) selectedOptions = { ...selectedOptions, ...updates };
    }
    $: if ($milestones?.length) {
        const updates = {};
        for (const milestoneType of $milestones) {
            if (selectedOptions[milestoneType.id] == null) {
                const last = milestoneType.tiers?.[milestoneType.tiers.length - 1];
                updates[milestoneType.id] = last?.id ?? null;
            }
        }
        if (Object.keys(updates).length) selectedOptions = { ...selectedOptions, ...updates };
    }

    let specialPotionToggles = {};
    $: if ($specialPotions && Object.keys(specialPotionToggles).length === 0) {
        specialPotionToggles = Object.fromEntries($specialPotions.map((p) => [p.id, false]));
    }

    let environmentBuffToggles = {};
    $: if ($environmentBuffs && Object.keys(environmentBuffToggles).length === 0) {
        environmentBuffToggles = Object.fromEntries($environmentBuffs.map((b) => [b.id, false]));
    }

    let gamepassToggles = {};
    $: if ($gamepasses && Object.keys(gamepassToggles).length === 0) {
        gamepassToggles = Object.fromEntries($gamepasses.map((g) => [g.id, false]));
    }

    let eventToggles = {};
    $: if ($events && Object.keys(eventToggles).length === 0) {
        eventToggles = Object.fromEntries($events.map((e) => [e.id, false]));
    }

    let enchantValues = {};
    $: if ($enchants && Object.keys(enchantValues).length === 0) {
        enchantValues = Object.fromEntries($enchants.map((e) => [e.id, 0]));
    }

    let toggleValues = {
        worldNormal: false,
        worldShiny: false,
        fasterHatchMastery: false,
        dailyPerks: false
    };

    let numericValues = {
        shrineBlessing: 0,
        dreamerBlessing: 0,
        seasonStars: 0,
        luckierTogether: 0,
        eggsPerHatch: 1
    };

    $: selectedEgg = $eggs?.find((e) => e.id === selectedOptions.eggs);
    $: isInfinityEgg = selectedEgg?.type === "infinity";
    $: isWorldEgg = selectedEgg?.type === "world";
    $: eggWorldName = isWorldEgg ? ($worlds?.find((w) => w.id === selectedEgg.world)?.name || selectedEgg.world) : "";
    $: isRiftableEgg = !!selectedEgg && selectedEgg.riftable === true;
    $: selectedRift = $rifts?.find((r) => r.id === selectedOptions.rifts) || $rifts?.[0];

    $: selectedEggId = selectedOptions.eggs;
    $: selectedWorldId = selectedOptions.worlds;

    function handleSelect({ option, id }) {
        if (id === "eggs") {
            selectedOptions = { ...selectedOptions, [id]: option.id, rifts: $rifts?.[0]?.id ?? null };
            toggleValues.worldNormal = false;
            toggleValues.worldShiny = false;
        } else {
            selectedOptions = { ...selectedOptions, [id]: option.id };
        }
    }

    function updateSpecialPotionToggle(potionId) {
        specialPotionToggles = { ...specialPotionToggles, [potionId]: !specialPotionToggles[potionId] };
    }

    function updateEnvironmentBuffToggle(buffId) {
        environmentBuffToggles = { ...environmentBuffToggles, [buffId]: !environmentBuffToggles[buffId] };
    }

    function updateGamepassToggle(gamepassId) {
        gamepassToggles = { ...gamepassToggles, [gamepassId]: !gamepassToggles[gamepassId] };
    }

    function updateEventToggle(eventId) {
        eventToggles = { ...eventToggles, [eventId]: !eventToggles[eventId] };
    }

    function updateGameplayToggle(key) {
        toggleValues = { ...toggleValues, [key]: !toggleValues[key] };
    }

    function updateNumericValue(key, value) {
        numericValues = { ...numericValues, [key]: value };
    }

    function updateEnchantValue(enchantId, value) {
        enchantValues = { ...enchantValues, [enchantId]: value };
    }

    $: {
        const modifiers = [
            selectedEgg,
            selectedRift,
            $mastery?.luckyStreak?.find((s) => s.id === selectedOptions.luckyStreak),
            ...($potions || [])
                .map((potionType) => potionType.potions.find((p) => p.id === selectedOptions[potionType.id]))
                .filter(Boolean),
            ...($milestones || [])
                .map((milestoneType) => milestoneType.tiers.find((t) => t.id === selectedOptions[milestoneType.id]))
                .filter(Boolean),
            ...($specialPotions || []).filter((p) => specialPotionToggles[p.id]),
            ...($environmentBuffs || []).filter((b) => environmentBuffToggles[b.id]),
            ...($gamepasses || []).filter((g) => gamepassToggles[g.id]),
            ...($events || []).filter((ev) => eventToggles[ev.id]),
            ...($enchants || [])
                .map((enchant) => ({ ...enchant, _value: Number(enchantValues[enchant.id]) }))
                .filter((e) => e._value > 0)
        ].filter(Boolean);

        stats = calculateStats(modifiers, toggleValues, numericValues, $dailyPerks, $index, $mastery);
    }
</script>

<main class="user-input">
    <div class="menu-container">
        <!-- Egg Selection -->
        <section class="menu-section">
            <div class="menu-row">
                <span class="menu-label">
                    <img src="icons/eggs.png" alt="Eggs" class="menu-img" />
                    Egg:
                </span>
                <div class="menu-control">
                    <Dropdown
                        id="eggs"
                        options={$eggs || []}
                        selectedOption={$eggs?.find((e) => e.id === selectedOptions.eggs)}
                        onSelect={handleSelect}
                    />
                </div>
            </div>

            {#if isInfinityEgg}
                <div class="menu-row">
                    <span class="menu-label">
                        <img src="worlds/the-overworld.png" alt="World" class="menu-img" />
                        World:
                    </span>
                    <div class="menu-control">
                        <Dropdown
                            id="worlds"
                            options={$worlds || []}
                            selectedOption={$worlds?.find((e) => e.id === selectedOptions.worlds)}
                            onSelect={handleSelect}
                        />
                    </div>
                </div>
            {/if}

            {#if isRiftableEgg}
                <div class="menu-row">
                    <span class="menu-label">
                        <img src="icons/rift.png" alt="Rift" class="menu-img" />
                        Rift:
                    </span>
                    <div class="menu-control">
                        <Dropdown id="rifts" options={$rifts || []} selectedOption={selectedRift} onSelect={handleSelect} />
                    </div>
                </div>
            {/if}

            {#if isWorldEgg}
                <div class="menu-row">
                    <span class="menu-label">
                        <img src="icons/index.png" alt="Index" class="menu-img" />
                        {eggWorldName} Index:
                    </span>
                    <div class="menu-control world-index-controls">
                        <span class="index-label">Normal:</span>
                        <Checkbox
                            id="world-normal"
                            checked={toggleValues.worldNormal}
                            onChange={() => updateGameplayToggle("worldNormal")}
                        />
                        <span class="index-label">Shiny:</span>
                        <Checkbox
                            id="world-shiny"
                            checked={toggleValues.worldShiny}
                            onChange={() => updateGameplayToggle("worldShiny")}
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
                    <img src="icons/multi-egg.png" alt="Eggs Per Hatch" class="menu-img" />
                    Eggs Per Hatch:
                </span>
                <div class="menu-control">
                    <NumberInput
                        id="eggs-per-hatch"
                        value={numericValues.eggsPerHatch}
                        onInput={({ value }) => updateNumericValue("eggsPerHatch", value)}
                    />
                </div>
            </div>
        </section>

        <div class="section-separator"></div>

        <!-- Potions -->
        <section class="menu-section">
            {#each $potions || [] as potionType (potionType.id)}
                <div class="menu-row">
                    <span class="menu-label">
                        {#if potionType.img}
                            <img src={potionType.img} alt={potionType.name} class="menu-img" />
                        {/if}
                        {potionType.name}:
                    </span>
                    <div class="menu-control">
                        <Dropdown
                            id={potionType.id}
                            options={potionType.potions}
                            selectedOption={potionType.potions.find((o) => o.id === selectedOptions[potionType.id]) || potionType.potions[potionType.potions.length - 1]}
                            onSelect={handleSelect}
                        />
                    </div>
                </div>
            {/each}

            {#each $specialPotions || [] as potion (potion.id)}
                <div class="menu-row">
                    <span class="menu-label">
                        {#if potion.img}
                            <img src={potion.img} alt={potion.name} class="menu-img" />
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
            {#each $milestones || [] as milestoneType (milestoneType.id)}
                <div class="menu-row">
                    <span class="menu-label">
                        {#if milestoneType.img}
                            <img src={milestoneType.img} alt={milestoneType.name} class="menu-img" />
                        {/if}
                        {milestoneType.name}:
                    </span>
                    <div class="menu-control">
                        <Dropdown
                            id={milestoneType.id}
                            options={milestoneType.tiers}
                            selectedOption={milestoneType.tiers.find((o) => o.id === selectedOptions[milestoneType.id]) || milestoneType.tiers[milestoneType.tiers.length - 1]}
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
                    <img src="icons/bubble-shrine.png" alt="Shrine Blessing" class="menu-img" />
                    Shrine Blessing:
                </span>
                <div class="menu-control">
                    <NumberInput
                        id="shrine-blessing"
                        value={numericValues.shrineBlessing}
                        onInput={({ value }) => updateNumericValue("shrineBlessing", value)}
                    />
                </div>
            </div>

            <div class="menu-row">
                <span class="menu-label">
                    <img src="icons/dreamer-blessing.png" alt="Dreamer Blessing" class="menu-img" />
                    Dreamer Blessing:
                </span>
                <div class="menu-control">
                    <NumberInput
                        id="dreamer-blessing"
                        value={numericValues.dreamerBlessing}
                        onInput={({ value }) => updateNumericValue("dreamerBlessing", value)}
                    />
                </div>
            </div>

            <div class="menu-row">
                <span class="menu-label">
                    <img src="icons/season-stars.png" alt="Season Stars" class="menu-img" />
                    Season Stars:
                </span>
                <div class="menu-control">
                    <NumberInput
                        id="season-stars"
                        value={numericValues.seasonStars}
                        onInput={({ value }) => updateNumericValue("seasonStars", value)}
                    />
                </div>
            </div>
        </section>

        <div class="section-separator"></div>

        <!-- Enchants -->
        <section class="menu-section">
            {#each $enchants || [] as enchant (enchant.id)}
                <div class="menu-row">
                    <span class="menu-label">{enchant.name}:</span>
                    <div class="menu-control">
                        <NumberInput
                            id={enchant.id}
                            value={enchantValues[enchant.id]}
                            onInput={({ value }) => updateEnchantValue(enchant.id, value)}
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
                    <img src="icons/lucky-streak.png" alt="Lucky Streak" class="menu-img" />
                    Lucky Streak:
                </span>
                <div class="menu-control">
                    <Dropdown
                        id="luckyStreak"
                        options={$mastery?.luckyStreak || []}
                        selectedOption={$mastery?.luckyStreak?.find((o) => o.id === selectedOptions["luckyStreak"]) || $mastery?.luckyStreak?.[$mastery.luckyStreak.length - 1]}
                        onSelect={handleSelect}
                    />
                </div>
            </div>

            <div class="menu-row">
                <span class="menu-label">
                    <img src="icons/luckier-together.png" alt="Luckier Together" class="menu-img" />
                    Luckier Together:
                </span>
                <div class="menu-control">
                    <NumberInput
                        id="luckier-together"
                        value={numericValues.luckierTogether}
                        onInput={({ value }) => updateNumericValue("luckierTogether", value)}
                    />
                </div>
            </div>

            <div class="menu-row">
                <span class="menu-label">
                    <img src="icons/eggs.png" alt="Faster Hatch Mastery" class="menu-img" />
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
            {#each $environmentBuffs || [] as buff (buff.id)}
                <div class="menu-row">
                    <span class="menu-label">
                        {#if buff.img}
                            <img src={buff.img} alt={buff.name} class="menu-img" />
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
                    <img src="icons/daily-perks.png" alt="Premium Daily Perks" class="menu-img" />
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

            {#each $gamepasses || [] as gamepass (gamepass.id)}
                <div class="menu-row">
                    <span class="menu-label">
                        {#if gamepass.img}
                            <img src={gamepass.img} alt={gamepass.name} class="menu-img" />
                        {/if}
                        {gamepass.name}
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
            {#each $events || [] as event (event.id)}
                <div class="menu-row">
                    <span class="menu-label">
                        {#if event.img}
                            <img src={event.img} alt={event.name} class="menu-img" />
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
    </div>
</main>

<style>
    .user-input {
        background: var(--menu-bg);
        padding: 1.5rem;
        border-radius: var(--radius-md);
        box-shadow: var(--elevation-2);
        border: 1.5px solid var(--border);
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
        object-fit: cover;
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
