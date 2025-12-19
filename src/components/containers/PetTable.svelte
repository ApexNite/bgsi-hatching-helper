<script>
  import { onMount } from "svelte";
  import {
    getPetsToDisplay,
    calculateMeanHatchTime,
    calculateHatchTime,
    insertAggregateRows,
    isXLEligible,
  } from "../../lib/petUtils.js";
  import {
    formatChance,
    formatTime,
    formatChancePercent,
    formatChanceFraction,
    formatString,
  } from "../../lib/formatUtils.js";
  import { getCookie, setCookie, deleteCookie } from "../../lib/cookieUtils.js";
  import Checkbox from "../control/Checkbox.svelte";
  import Radio from "../control/Radio.svelte";
  import SmartImage from "../control/SmartImage.svelte";
  import XLWarningOverlay from "../overlays/XLWarningOverlay.svelte";

  export let stats;
  export let eggsPerHatch;
  export let selectedEggId;
  export let selectedWorldId;

  const defaultSettings = {
    chanceDisplayMode: "auto",
    timesDisplayMode: "mean",
    showHatchingTimes: true,
    showAnyLegendary: false,
    showAnySecretInfinity: false,
    showHeavenlyPoinsettia: false,
    showXL: false,
    hideNonSpecial: false,
    hideLegendary: false,
  };

  let settings = { ...defaultSettings };
  let settingsOpen = false;
  let settingsButton;
  let settingsMenu;
  let settingsMenuPosition = { top: 0, right: 0 };
  let windowWidth = window.innerWidth;
  let showWarning = false;
  let hasShownXLWarning = false;

  onMount(() => {
    try {
      const savedData = getCookie("hatching-helper-pet-table-settings");

      if (savedData) {
        settings = { ...defaultSettings, ...savedData.settings };
        hasShownXLWarning = savedData.hasShownXLWarning || false;
      }
    } catch {
      deleteCookie("hatching-helper-pet-table-settings");
    }

    const handleResize = () => {
      windowWidth = window.innerWidth;
    };

    const onScroll = () => {
      settingsOpen = false;
    };

    const onDocClick = (e) => {
      if (!settingsButton || settingsButton.contains(e.target)) {
        return;
      }

      if (settingsMenu && settingsMenu.contains(e.target)) {
        return;
      }

      settingsOpen = false;
    };

    // https://stackoverflow.com/a/69612018
    const onAnimationStart = (event) => {
      const isLegendaryAnimation = event.animationName.includes("legendaryHue");
      const isInfinityAnimation = event.animationName.includes("infinityWave");

      if (isLegendaryAnimation || isInfinityAnimation) {
        const elements = document.querySelectorAll(
          isLegendaryAnimation ? ".rarity-legendary" : ".rarity-infinity",
        );

        function getAnimation(element) {
          return element
            .getAnimations()
            .find((a) => a.animationName === event.animationName);
        }

        const animations = Array.from(elements)
          .map(getAnimation)
          .filter(Boolean);

        const maxCurrentTime = Math.max(
          ...animations.map((a) => a.currentTime ?? 0),
        );

        animations.forEach((a) => {
          a.currentTime = maxCurrentTime;
        });
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", onScroll);
    document.addEventListener("click", onDocClick);
    document.addEventListener("animationstart", onAnimationStart);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("animationstart", onAnimationStart);
    };
  });

  function saveSettings() {
    setCookie("hatching-helper-pet-table-settings", {
      settings,
      hasShownXLWarning,
    });
  }

  function toggleSettings() {
    if (!settingsOpen && settingsButton) {
      const rect = settingsButton.getBoundingClientRect();
      settingsMenuPosition = {
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      };
    }

    settingsOpen = !settingsOpen;
  }

  $: basePets =
    stats && selectedEggId && selectedWorldId
      ? getPetsToDisplay(
          selectedEggId,
          selectedWorldId,
          stats,
          settings.showHeavenlyPoinsettia,
        )
      : [];

  $: petsWithAggregates =
    basePets.length > 0
      ? insertAggregateRows(basePets, {
          anyLegendary: settings.showAnyLegendary,
          anySecretInfinity: settings.showAnySecretInfinity,
        })
      : [];

  $: filteredPets = settings.hideNonSpecial
    ? petsWithAggregates.filter((p) =>
        ["legendary", "secret", "infinity"].includes(p.rarity),
      )
    : petsWithAggregates;

  $: if (settings.hideLegendary) {
    filteredPets = filteredPets.filter((p) => p.rarity !== "legendary");
  }

  function displayChance(value) {
    if (settings.chanceDisplayMode === "percent") {
      return formatChancePercent(value);
    }

    if (settings.chanceDisplayMode === "fraction") {
      return formatChanceFraction(value, "ceil");
    }

    return formatChance(value);
  }

  function displayTime(value) {
    if (settings.timesDisplayMode === "median") {
      return calculateHatchTime(value, stats.hatchSpeed, eggsPerHatch, 0.5);
    }

    if (settings.timesDisplayMode === "90%") {
      return calculateHatchTime(value, stats.hatchSpeed, eggsPerHatch, 0.9);
    }

    return calculateMeanHatchTime(value, stats.hatchSpeed, eggsPerHatch);
  }

  function toggle(key) {
    settings = { ...settings, [key]: !settings[key] };
    
    if (key === "showXL" && settings[key] && !hasShownXLWarning) {
      showWarning = true;
      hasShownXLWarning = true;
    }
    
    saveSettings();
  }

  function setChanceDisplayMode(mode) {
    settings = { ...settings, chanceDisplayMode: mode };
    saveSettings();
  }

  function setTimesDisplayMode(mode) {
    settings = { ...settings, timesDisplayMode: mode };
    saveSettings();
  }
</script>

<div class="pet-table-wrapper">
  <div class="pet-table-container">
    <table class="pet-table">
      <thead>
        <tr>
          <th>Pet</th>
          <th>Normal</th>
          <th>Shiny</th>
          <th>Mythic</th>
          <th>
            <div class="th-content">
              <span class="th-title">Shiny Mythic</span>
              <button
                class="settings-btn"
                bind:this={settingsButton}
                on:click={toggleSettings}
              >
                ⚙️
              </button>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {#each filteredPets as pet (pet.id || pet.__aggregateId || pet.rarity)}
          <tr>
            <td>
              <div class="pet-name">
                {#if pet.__aggregate}
                  <div class="aggregate-dot rarity-{pet.rarity}"></div>
                  <div class="pet-info">
                    <span class="name">
                      {formatString(
                        pet.name,
                        Math.floor(Math.max((windowWidth / 100) * 1.3, 18)),
                      )}
                    </span>
                    <span class="rarity-badge rarity-{pet.rarity}">
                      {pet.rarity}
                      {#if settings.showXL && isXLEligible(pet)}
                        <strong class="rarity-{pet.rarity}">XL</strong>
                      {/if}
                    </span>
                  </div>
                {:else}
                  <SmartImage
                    base={pet.img}
                    placeholder="pet"
                    alt={pet.name || pet.rarity}
                    decoding="async"
                    size="32px"
                  />
                  <div class="pet-info">
                    <span class="name">
                      {formatString(
                        pet.name,
                        Math.floor(Math.max((windowWidth / 100) * 1.3, 18)),
                      )}
                    </span>
                    <span class="rarity-badge rarity-{pet.rarity}">
                      {pet.rarity}
                      {#if settings.showXL && isXLEligible(pet)}
                        <strong class="rarity-{pet.rarity}">XL</strong>
                      {/if}
                    </span>
                  </div>
                {/if}
              </div>
            </td>

            <td>
              {#if pet.finalChance >= 0}
                <div class="chance-time">
                  <div>
                    {displayChance(
                      settings.showXL && isXLEligible(pet) ? pet.finalXLChance : pet.finalChance,
                    )}
                  </div>
                  {#if settings.showHatchingTimes}
                    <div class="time">
                      {formatTime(
                        displayTime(
                          settings.showXL && isXLEligible(pet) ? pet.finalXLChance : pet.finalChance,
                        ),
                      )}
                    </div>
                  {/if}
                </div>
              {:else}
                -
              {/if}
            </td>
            <td>
              {#if pet.finalShinyChance >= 0}
                <div class="chance-time">
                  <div>
                    {displayChance(
                      settings.showXL && isXLEligible(pet)
                        ? pet.finalShinyXLChance
                        : pet.finalShinyChance,
                    )}
                  </div>
                  {#if settings.showHatchingTimes}
                    <div class="time">
                      {formatTime(
                        displayTime(
                          settings.showXL && isXLEligible(pet)
                            ? pet.finalShinyXLChance
                            : pet.finalShinyChance,
                        ),
                      )}
                    </div>
                  {/if}
                </div>
              {:else}
                -
              {/if}
            </td>
            <td>
              {#if pet.finalMythicChance >= 0}
                <div class="chance-time">
                  <div>
                    {displayChance(
                      settings.showXL && isXLEligible(pet)
                        ? pet.finalMythicXLChance
                        : pet.finalMythicChance,
                    )}
                  </div>
                  {#if settings.showHatchingTimes}
                    <div class="time">
                      {formatTime(
                        displayTime(
                          settings.showXL && isXLEligible(pet)
                            ? pet.finalMythicXLChance
                            : pet.finalMythicChance,
                        ),
                      )}
                    </div>
                  {/if}
                </div>
              {:else}
                -
              {/if}
            </td>
            <td>
              {#if pet.finalShinyMythicChance >= 0}
                <div class="chance-time">
                  <div>
                    {displayChance(
                      settings.showXL && isXLEligible(pet)
                        ? pet.finalShinyMythicXLChance
                        : pet.finalShinyMythicChance,
                    )}
                  </div>
                  {#if settings.showHatchingTimes}
                    <div class="time">
                      {formatTime(
                        displayTime(
                          settings.showXL && isXLEligible(pet)
                            ? pet.finalShinyMythicXLChance
                            : pet.finalShinyMythicChance,
                        ),
                      )}
                    </div>
                  {/if}
                </div>
              {:else}
                -
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if settingsOpen}
    <div
      class="settings-menu"
      bind:this={settingsMenu}
      style="position: fixed; top: {settingsMenuPosition.top}px; right: {settingsMenuPosition.right}px;"
    >
      <div class="section">
        <div class="section-title">Chance display</div>
        <label class="row">
          <Radio
            name="chanceMode"
            value="auto"
            checked={settings.chanceDisplayMode === "auto"}
            onChange={() => setChanceDisplayMode("auto")}
            size="sm"
          />
          <span>Auto</span>
        </label>
        <label class="row">
          <Radio
            name="chanceMode"
            value="percent"
            checked={settings.chanceDisplayMode === "percent"}
            onChange={() => setChanceDisplayMode("percent")}
            size="sm"
          />
          <span>Percent</span>
        </label>
        <label class="row">
          <Radio
            name="chanceMode"
            value="fraction"
            checked={settings.chanceDisplayMode === "fraction"}
            onChange={() => setChanceDisplayMode("fraction")}
            size="sm"
          />
          <span>Fraction</span>
        </label>
      </div>

      <div class="section">
        <div class="section-title">Times display</div>
        <label class="row">
          <Radio
            name="timesMode"
            value="mean"
            checked={settings.timesDisplayMode === "mean"}
            onChange={() => setTimesDisplayMode("mean")}
            size="sm"
          />
          <span>Mean</span>
        </label>
        <label class="row">
          <Radio
            name="timesMode"
            value="median"
            checked={settings.timesDisplayMode === "median"}
            onChange={() => setTimesDisplayMode("median")}
            size="sm"
          />
          <span>Median</span>
        </label>
        <label class="row">
          <Radio
            name="timesMode"
            value="90%"
            checked={settings.timesDisplayMode === "90%"}
            onChange={() => setTimesDisplayMode("90%")}
            size="sm"
          />
          <span>90% Chance</span>
        </label>
      </div>

      <div class="section">
        <div class="section-title">Rows</div>
        <label class="row">
          <Checkbox
            id="showHatchingTimes"
            checked={settings.showHatchingTimes}
            onChange={() => toggle("showHatchingTimes")}
            size="sm"
          />
          <span>Show Hatching Times</span>
        </label>
        <label class="row">
          <Checkbox
            id="showXL"
            checked={settings.showXL}
            onChange={() => toggle("showXL")}
            size="sm"
          />
          <span>Show XL</span>
        </label>
        <label class="row">
          <Checkbox
            id="showAnyLegendary"
            checked={settings.showAnyLegendary}
            onChange={() => toggle("showAnyLegendary")}
            size="sm"
          />
          <span>Show Any Legendary</span>
        </label>
        <label class="row">
          <Checkbox
            id="showAnySecretInfinity"
            checked={settings.showAnySecretInfinity}
            onChange={() => toggle("showAnySecretInfinity")}
            size="sm"
          />
          <span>Show Any Secret</span>
        </label>
        <label class="row">
          <Checkbox
            id="showHeavenlyPoinsettia"
            checked={settings.showHeavenlyPoinsettia}
            onChange={() => toggle("showHeavenlyPoinsettia")}
            size="sm"
          />
          <span>Show Heavenly Poinsettia</span>
        </label>
        <label class="row">
          <Checkbox
            id="hideNonSpecial"
            checked={settings.hideNonSpecial}
            onChange={() => toggle("hideNonSpecial")}
            size="sm"
          />
          <span>Hide Easy Pets</span>
        </label>
        <label class="row">
          <Checkbox
            id="hideLegendary"
            checked={settings.hideLegendary}
            onChange={() => toggle("hideLegendary")}
            size="sm"
          />
          <span>Hide Legendary Pets</span>
        </label>
      </div>
    </div>
  {/if}

  <XLWarningOverlay bind:open={showWarning} />
</div>

<style>
  .pet-table-wrapper {
    position: relative;
  }

  .pet-table-container {
    max-width: 100%;
    overflow-x: auto;
    background: var(--menu-bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--elevation);
  }

  .pet-table {
    width: 100%;
    min-width: 850px;
    border-collapse: collapse;
    color: var(--primary-text);
  }

  .pet-table thead {
    background: color-mix(in srgb, var(--accent) 10%, var(--menu-bg));
  }

  .pet-table th,
  .pet-table td {
    padding: 0.75rem 0.5rem 0.75rem 0.75rem;
    min-width: 19.5%;
    text-align: left;
    vertical-align: middle;
    border-bottom: 1px solid var(--border);
  }

  .pet-table th:first-child,
  .pet-table td:first-child {
    min-width: 22%;
  }

  .pet-table th:not(:first-child),
  .pet-table td:not(:first-child) {
    padding: 0.1rem;
    text-align: center;
  }

  .pet-table th {
    font-size: 1.05rem;
    font-weight: 600;
  }

  .pet-table tbody tr {
    transition: background-color 0.2s ease;
  }

  .pet-table tbody tr:hover {
    background-color: color-mix(in srgb, var(--accent) 5%, transparent);
  }

  .pet-table tbody tr:last-child td {
    border-bottom: none;
  }

  .th-content {
    position: relative;
    display: block;
    min-height: 28px;
  }

  .th-title {
    position: absolute;
    left: 50%;
    top: 50%;
    max-width: calc(100% - 40px);
    transform: translate(-50%, -50%);
    text-align: center;
    white-space: nowrap;
  }

  .settings-btn {
    position: absolute;
    top: 50%;
    right: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    transform: translateY(-50%);
    background: none;
    border: 0;
    border-radius: var(--radius-md);
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .settings-btn:hover {
    background: color-mix(in srgb, var(--accent) 15%, transparent);
  }

  .settings-menu {
    position: fixed;
    z-index: 1000;
    width: 260px;
    padding: 0.5rem;
    background: var(--menu-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--primary-text);
    box-shadow: var(--elevation);
  }

  .section {
    padding: 0.5rem;
  }

  .section-title {
    margin-bottom: 0.4rem;
    font-size: 0.9rem;
    font-weight: 600;
    opacity: 0.9;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
  }

  .pet-name {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .aggregate-dot {
    width: 32px;
    height: 32px;
    border: 2px solid currentColor;
    border-radius: 50%;
  }

  .pet-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .name {
    white-space: pre;
    font-weight: 600;
  }

  .rarity-badge {
    width: fit-content;
    padding: 0.125rem 0.375rem;
    background: transparent;
    border: 1px solid currentColor;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: capitalize;
  }

  .rarity-badge strong {
    font-size: inherit;
    line-height: 1;
  }

  .chance-time {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .time {
    font-size: 0.85rem;
    opacity: 0.8;
  }

  .rarity-common {
    color: var(--rarity-common);
  }

  .rarity-unique {
    color: var(--rarity-unique);
  }

  .rarity-rare {
    color: var(--rarity-rare);
  }

  .rarity-epic {
    color: var(--rarity-epic);
  }

  .rarity-secret {
    color: var(--rarity-secret);
  }

  .rarity-legendary {
    color: hsl(var(--legendary-hue) 100% 60%);
    animation: legendaryHue 6s linear infinite;
  }

  /* https://stackoverflow.com/a/54702294 */
  .rarity-infinity {
    background: linear-gradient(
      to right,
      #cc4444,
      #cc7744,
      #cccc44,
      #44cc44,
      #4444cc,
      #6644aa,
      #aa44cc,
      #cc4444
    );
    background-size: 400% 100%;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    border-color: var(--rarity-infinity-border);
    animation: infinityWave 16s linear infinite;
  }

  @property --legendary-hue {
    syntax: "<number>";
    inherits: false;
    initial-value: 0;
  }

  @keyframes legendaryHue {
    0% {
      --legendary-hue: 0;
    }
    50% {
      --legendary-hue: 180;
    }
    100% {
      --legendary-hue: 360;
    }
  }

  @keyframes infinityWave {
    0% {
      background-position: 0% 0;
    }
    100% {
      background-position: -400% 0;
    }
  }
</style>
