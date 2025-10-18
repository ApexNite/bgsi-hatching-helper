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

  export let activeTab = "chances";
  export let stats;
  export let eggsPerHatch;
  export let selectedEggId;
  export let selectedWorldId;

  const COOKIE_VERSION = 1;

  const defaultSettings = {
    chanceDisplayMode: "auto",
    hideNonSpecial: false,
    showAnyLegendary: false,
    showAnySecretInfinity: false,
  };

  let settings = defaultSettings;
  let settingsOpen = false;
  let settingsHost;

  onMount(() => {
    try {
      const savedData = getCookie("hatching-helper-pet-table-settings");

      if (savedData && savedData.version === COOKIE_VERSION) {
        settings = { ...defaultSettings, ...savedData.settings };
      } else if (savedData) {
        deleteCookie("hatching-helper-pet-table-settings");
      }
    } catch (e) {
      deleteCookie("hatching-helper-pet-table-settings");
    }

    const onDocClick = (e) => {
      if (!settingsHost) {
        return;
      }

      if (!settingsHost.contains(e.target)) {
        settingsOpen = false;
      }
    };

    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  });

  function saveSettings() {
    const dataToSave = {
      version: COOKIE_VERSION,
      settings,
    };

    setCookie("hatching-helper-pet-table-settings", dataToSave);
  }

  $: basePets = getPetsToDisplay(selectedEggId, selectedWorldId, stats);

  $: petsWithAggregates = insertAggregateRows(basePets, {
    anyLegendary: settings.showAnyLegendary,
    anySecretInfinity: settings.showAnySecretInfinity,
  });

  const specialSet = new Set(["legendary", "secret", "infinity"]);
  $: filteredPets = settings.hideNonSpecial
    ? petsWithAggregates.filter((p) =>
        specialSet.has((p.rarity || "").toLowerCase()),
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

<div class="pet-table-container">
  <table class="pet-table">
    <thead>
      <tr>
        <th>Pet</th>
        <th>Normal</th>
        <th>Shiny</th>
        <th>Mythic</th>
        <th class="has-settings" bind:this={settingsHost}>
          <div class="th-content">
            <span>Shiny Mythic</span>
            <button
              class="settings-btn"
              on:click={() => (settingsOpen = !settingsOpen)}
            >
              ⚙️
            </button>

            {#if settingsOpen}
              <div class="settings-menu">
                <div class="section">
                  <div class="section-title">Chance display</div>
                  <label>
                    <input
                      type="radio"
                      name="chanceMode"
                      value="auto"
                      checked={settings.chanceDisplayMode === "auto"}
                      on:change={() => setChanceDisplayMode("auto")}
                    />
                    Auto
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="chanceMode"
                      value="percent"
                      checked={settings.chanceDisplayMode === "percent"}
                      on:change={() => setChanceDisplayMode("percent")}
                    />
                    Percent
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="chanceMode"
                      value="fraction"
                      checked={settings.chanceDisplayMode === "fraction"}
                      on:change={() => setChanceDisplayMode("fraction")}
                    />
                    Fraction
                  </label>
                </div>

                <div class="section">
                  <div class="section-title">Rows</div>
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.hideNonSpecial}
                      on:change={() => toggle("hideNonSpecial")}
                    />
                    Hide Easy Pets
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.showAnyLegendary}
                      on:change={() => toggle("showAnyLegendary")}
                    />
                    Show Any Legendary
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.showAnySecretInfinity}
                      on:change={() => toggle("showAnySecretInfinity")}
                    />
                    Show Any Secret
                  </label>
                </div>
              </div>
            {/if}
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
                <picture>
                  <source srcset="{pet.img}.avif" type="image/avif" />
                  <source srcset="{pet.img}.webp" type="image/webp" />
                  <img
                    src="{pet.img}.png"
                    alt={pet.name || pet.rarity}
                    class="pet-image"
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
                <div class="pet-info">
                  <span class="name">{pet.name || pet.rarity}</span>
                  <span class="rarity-badge rarity-{pet.rarity}"
                    >{pet.rarity}</span
                  >
                </div>
              {/if}
            </div>
          </td>

          {#if activeTab === "chances"}
            <td>{displayChance(pet.finalChance)}</td>
            <td>{displayChance(pet.finalShinyChance)}</td>
            <td>
              {#if pet.finalMythicChance > 0}
                {displayChance(pet.finalMythicChance)}
              {:else}
                -
              {/if}
            </td>
            <td>
              {#if pet.finalShinyMythicChance > 0}
                {displayChance(pet.finalShinyMythicChance)}
              {:else}
                -
              {/if}
            </td>
          {/if}

          {#if activeTab === "times"}
            <td
              >{formatTime(
                calculateHatchTime(
                  pet.finalChance,
                  stats.hatchSpeed,
                  eggsPerHatch,
                ),
              )}</td
            >
            <td
              >{formatTime(
                calculateHatchTime(
                  pet.finalShinyChance,
                  stats.hatchSpeed,
                  eggsPerHatch,
                ),
              )}</td
            >
            <td>
              {#if pet.finalMythicChance > 0}
                {formatTime(
                  calculateHatchTime(
                    pet.finalMythicChance,
                    stats.hatchSpeed,
                    eggsPerHatch,
                  ),
                )}
              {:else}
                -
              {/if}
            </td>
            <td>
              {#if pet.finalShinyMythicChance > 0}
                {formatTime(
                  calculateHatchTime(
                    pet.finalShinyMythicChance,
                    stats.hatchSpeed,
                    eggsPerHatch,
                  ),
                )}
              {:else}
                -
              {/if}
            </td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<!-- TODO: fix overflow issues & look through and clean up form input -->
<style>
  .pet-table-container {
    background: var(--menu-bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--elevation);
    overflow: visible;
  }

  .pet-table {
    width: 100%;
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

  .has-settings {
    position: relative;
  }

  .th-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
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
  }

  .settings-btn:hover {
    background: color-mix(in srgb, var(--accent) 15%, transparent);
  }

  .settings-menu {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 40;
    width: 260px;
    background: var(--menu-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 0.5rem;
    color: var(--primary-text);
  }

  .section {
    padding: 0.5rem;
  }

  .section-title {
    margin-bottom: 0.4rem;
    font-size: 0.9rem;
    font-weight: 700;
    opacity: 0.9;
  }

  .section label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0;
    cursor: pointer;
    font-size: 0.95rem;
  }

  .section input[type="radio"],
  .section input[type="checkbox"] {
    position: relative;
    appearance: none;
    width: 20px;
    height: 20px;
    background: var(--menu-bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .section input[type="radio"] {
    border-radius: 50%;
  }

  .section input[type="radio"]:hover,
  .section input[type="checkbox"]:hover {
    background: color-mix(in srgb, var(--accent) 5%, var(--menu-bg));
  }

  .section input[type="radio"]:checked,
  .section input[type="checkbox"]:checked {
    background: color-mix(in srgb, var(--accent) 5%, var(--menu-bg));
    border-color: var(--accent);
  }

  .section input[type="radio"]:checked::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 8px;
    height: 8px;
    background: var(--accent);
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }

  .section input[type="checkbox"]:checked::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 6px;
    height: 10px;
    border: solid var(--accent);
    border-width: 0 2px 2px 0;
    transform: translate(-50%, -60%) rotate(45deg);
  }

  .pet-name {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .aggregate-dot {
    width: 28px;
    height: 28px;
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
      #6666ff,
      #0099ff,
      #00ff00,
      #ff3399,
      #6666ff
    );
    background-size: 400% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    border-color: var(--rarity-infinity-border);
    animation: infinityWave 12s ease-in-out infinite;
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
    0%,
    100% {
      background-position: 0 0;
    }
    50% {
      background-position: 100% 0;
    }
  }
</style>
