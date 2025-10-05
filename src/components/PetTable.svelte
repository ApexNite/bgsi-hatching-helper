<script>
  import { getPetsToDisplay, calculateHatchTime } from '../lib/petUtils.js';
  import { formatChance, formatTime } from '../lib/formatUtils.js';

  export let activeTab = 'chances';
  export let stats;
  export let eggsPerHatch;
  export let selectedEggId;
  export let selectedWorldId;

  $: petsToDisplay = getPetsToDisplay(selectedEggId, selectedWorldId, stats);
</script>

<div class="pet-table-container">
  <table class="pet-table">
    <thead>
      <tr>
        <th>Pet</th>
        <th>Normal</th>
        <th>Shiny</th>
        <th>Mythic</th>
        <th>Shiny Mythic</th>
      </tr>
    </thead>
    <tbody>
      {#each petsToDisplay as pet (pet.id || pet.rarity)}
        <tr>
          <td>
            <div class="pet-name">
              <picture>
                  <source srcset="{pet.img}.avif" type="image/avif">
                  <source srcset="{pet.img}.webp" type="image/webp">
                  <img src="{pet.img}.png" alt={pet.name || pet.rarity} class="pet-image" loading="lazy" decoding="async" />
              </picture>
              <div class="pet-info">
                <span class="name">{pet.name || pet.rarity}</span>
                <span class="rarity-badge rarity-{pet.rarity}">{pet.rarity}</span>
              </div>
            </div>
          </td>
          {#if activeTab === 'chances'}
            <td>{formatChance(pet.finalChance)}</td>
            <td>{formatChance(pet.finalShinyChance)}</td>
            <td>{pet.finalMythicChance > 0 ? formatChance(pet.finalMythicChance) : '-'}</td>
            <td>{pet.finalShinyMythicChance > 0 ? formatChance(pet.finalShinyMythicChance) : '-'}</td>
          {/if}
          {#if activeTab === 'times'}
            <td>{formatTime(calculateHatchTime(pet.finalChance, stats.hatchSpeed, eggsPerHatch))}</td>
            <td>{formatTime(calculateHatchTime(pet.finalShinyChance, stats.hatchSpeed, eggsPerHatch))}</td>
            <td>{pet.finalMythicChance > 0
              ? formatTime(calculateHatchTime(pet.finalMythicChance, stats.hatchSpeed, eggsPerHatch))
              : '-'}</td>
            <td>{pet.finalShinyMythicChance > 0
              ? formatTime(calculateHatchTime(pet.finalShinyMythicChance, stats.hatchSpeed, eggsPerHatch))
              : '-'}</td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .pet-table-container {
    background: var(--menu-bg);
    border: 1.5px solid var(--border);
    box-shadow: var(--elevation);
    border-radius: var(--radius-md);
    overflow: hidden;
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
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }

  .pet-table th {
    font-weight: 600;
    font-size: 1.05rem;
  }

  .pet-table tbody tr:hover {
    background-color: color-mix(in srgb, var(--accent) 5%, transparent);
    transition: background-color 0.2s ease;
  }

  .pet-table tbody tr:last-child td {
    border-bottom: none;
  }

  .pet-name {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .pet-image {
    width: 32px;
    height: 32px;
    object-fit: contain;
    flex-shrink: 0;
    display: block;
  }

  .pet-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .pet-info .name {
    font-weight: 600;
    font-size: 1rem;
    line-height: 1.1;
  }

  .rarity-badge {
    display: inline-block;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: capitalize;
    width: fit-content;
    border: 1px solid currentColor;
    background: transparent;
  }

  .rarity-badge.rarity-common { color: var(--rarity-common); }
  .rarity-badge.rarity-unique { color: var(--rarity-unique); }
  .rarity-badge.rarity-rare { color: var(--rarity-rare); }
  .rarity-badge.rarity-epic { color: var(--rarity-epic); }
  .rarity-badge.rarity-secret { color: var(--rarity-secret); }

  @property --legendary-hue {
    syntax: '<number>';
    inherits: false;
    initial-value: 0;
  }

  .rarity-badge.rarity-legendary {
    --legendary-hue: 0;
    color: hsl(var(--legendary-hue) 100% 60%);
    animation: legendaryHue 6s linear infinite;
  }

  @keyframes legendaryHue {
    0% { --legendary-hue: 0; }
    50% { --legendary-hue: 180; }
    100% { --legendary-hue: 360; }
  }

  /* https://stackoverflow.com/a/54702294 */
  .rarity-badge.rarity-infinity {
    background: linear-gradient(to right, #6666ff, #0099ff, #00ff00, #ff3399, #6666ff);
    background-size: 400% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    border-color: var(--rarity-infinity-border);
    animation: infinityWave 12s ease-in-out infinite;
  }

  @keyframes infinityWave {
    0%, 100% {
      background-position: 0 0;
    }
    50% {
      background-position: 100% 0;
    }
  }
</style>