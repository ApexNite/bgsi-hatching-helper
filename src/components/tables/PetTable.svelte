<script>
  import { onMount } from "svelte";
  import {
    getPetsToDisplay,
    calculateHatchTime,
    insertAggregateRows,
  } from "../../lib/petUtils.js";
  import {
    formatChance,
    formatTime,
    formatChancePercent,
    formatChanceFraction,
  } from "../../lib/formatUtils.js";
  import { getCookie, setCookie, deleteCookie } from "../../lib/cookieUtils.js";
  import Checkbox from "../form/Checkbox.svelte";
  import Radio from "../form/Radio.svelte";
  import SmartImage from "../media/SmartImage.svelte";

  export let stats;
  export let eggsPerHatch;
  export let selectedEggId;
  export let selectedWorldId;

  const COOKIE_VERSION = 4;

  const defaultSettings = {
    chanceDisplayMode: "auto",
    showHatchingTimes: true,
    showAnyLegendary: false,
    showAnySecretInfinity: false,
    hideNonSpecial: false,
  };

  let settings = { ...defaultSettings };
  let settingsOpen = false;
  let settingsButton;
  let settingsMenu;
  let settingsMenuPosition = { top: 0, right: 0 };

  onMount(() => {
    try {
      const savedData = getCookie("hatching-helper-pet-table-settings");

      if (savedData && savedData.version === COOKIE_VERSION) {
        settings = { ...defaultSettings, ...savedData.settings };
      } else if (savedData) {
        deleteCookie("hatching-helper-pet-table-settings");
      }
    } catch {
      deleteCookie("hatching-helper-pet-table-settings");
    }

    const onDocClick = (e) => {
      if (!settingsButton || settingsButton.contains(e.target)) {
        return;
      }

      if (settingsMenu && settingsMenu.contains(e.target)) {
        return;
      }

      settingsOpen = false;
    };

    const onScroll = () => {
      settingsOpen = false;
    };

    document.addEventListener("click", onDocClick);
    window.addEventListener("scroll", onScroll);

    return () => {
      document.removeEventListener("click", onDocClick);
      window.removeEventListener("scroll", onScroll);
    };
  });

  function saveSettings() {
    setCookie("hatching-helper-pet-table-settings", {
      version: COOKIE_VERSION,
      settings,
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
      ? getPetsToDisplay(selectedEggId, selectedWorldId, stats)
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

  function displayChance(value) {
    if (settings.chanceDisplayMode === "percent") {
      return formatChancePercent(value);
    }

    if (settings.chanceDisplayMode === "fraction") {
      return formatChanceFraction(value);
    }

    return formatChance(value);
  }

  function toggle(key) {
    settings = { ...settings, [key]: !settings[key] };
    saveSettings();
  }

  function setChanceDisplayMode(mode) {
    settings = { ...settings, chanceDisplayMode: mode };
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
              <span>Shiny Mythic</span>
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
                    <span class="name">{pet.name}</span>
                    <span class="rarity-badge rarity-{pet.rarity}"
                      >{pet.rarity}</span
                    >
                  </div>
                {:else}
                  <SmartImage
                    base={pet.img}
                    alt={pet.name || pet.rarity}
                    decoding="async"
                    size="32px"
                  />
                  <div class="pet-info">
                    <span class="name">{pet.name || pet.rarity}</span>
                    <span class="rarity-badge rarity-{pet.rarity}"
                      >{pet.rarity}</span
                    >
                  </div>
                {/if}
              </div>
            </td>

            <td>
              {#if pet.finalChance > 0}
                <div class="chance-time">
                  <div>{displayChance(pet.finalChance)}</div>
                  {#if settings.showHatchingTimes}
                    <div class="time">
                      {formatTime(
                        calculateHatchTime(
                          pet.finalChance,
                          stats.hatchSpeed,
                          eggsPerHatch,
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
              {#if pet.finalShinyChance > 0}
                <div class="chance-time">
                  <div>{displayChance(pet.finalShinyChance)}</div>
                  {#if settings.showHatchingTimes}
                    <div class="time">
                      {formatTime(
                        calculateHatchTime(
                          pet.finalShinyChance,
                          stats.hatchSpeed,
                          eggsPerHatch,
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
              {#if pet.finalMythicChance > 0}
                <div class="chance-time">
                  <div>{displayChance(pet.finalMythicChance)}</div>
                  {#if settings.showHatchingTimes}
                    <div class="time">
                      {formatTime(
                        calculateHatchTime(
                          pet.finalMythicChance,
                          stats.hatchSpeed,
                          eggsPerHatch,
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
              {#if pet.finalShinyMythicChance > 0}
                <div class="chance-time">
                  <div>{displayChance(pet.finalShinyMythicChance)}</div>
                  {#if settings.showHatchingTimes}
                    <div class="time">
                      {formatTime(
                        calculateHatchTime(
                          pet.finalShinyMythicChance,
                          stats.hatchSpeed,
                          eggsPerHatch,
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
            id="hideNonSpecial"
            checked={settings.hideNonSpecial}
            onChange={() => toggle("hideNonSpecial")}
            size="sm"
          />
          <span>Hide Easy Pets</span>
        </label>
      </div>
    </div>
  {/if}
</div>

<style>
  .pet-table-wrapper {
    position: relative;
  }

  .pet-table-container {
    background: var(--menu-bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--elevation);
    overflow-x: auto;
    max-width: 100%;
  }

  .pet-table {
    width: 100%;
    min-width: 600px;
    border-collapse: collapse;
    color: var(--primary-text);
  }

  .pet-table thead {
    background: color-mix(in srgb, var(--accent) 10%, var(--menu-bg));
  }

  .pet-table th,
  .pet-table td {
    padding: 0.75rem 1rem;
    text-align: left;
    vertical-align: middle;
    border-bottom: 1px solid var(--border);
  }

  .pet-table th:first-child,
  .pet-table td:first-child {
    width: 25%;
  }

  .pet-table th:not(:first-child),
  .pet-table td:not(:first-child) {
    padding: 0rem 0rem;
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .settings-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    background: none;
    border: 0;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 20px;
    line-height: 1;
    transition: background-color 0.2s ease;
    position: absolute;
    right: 0.75rem;
  }

  .settings-btn:hover {
    background: color-mix(in srgb, var(--accent) 15%, transparent);
  }

  .settings-menu {
    z-index: 1000;
    width: 260px;
    background: var(--menu-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 0.5rem;
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
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 700;
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

  .pet-image {
    width: 32px;
    height: 32px;
    display: block;
    flex-shrink: 0;
  }

  .pet-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .name {
    font-weight: 600;
  }

  .rarity-badge {
    padding: 0.125rem 0.375rem;
    border: 1px solid currentColor;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: capitalize;
    width: fit-content;
    background: transparent;
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
    -webkit-background-clip: text;
    background-clip: text;
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
