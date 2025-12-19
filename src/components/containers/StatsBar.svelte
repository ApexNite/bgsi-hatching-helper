<script>
  import {
    formatChancePercent,
    formatChanceFraction,
    formatMultiplier,
  } from "../../lib/formatUtils.js";
  import { calculateEggsPerSecond } from "../../lib/petUtils.js";
  import SmartImage from "../control/SmartImage.svelte";

  export let stats = {
    luck: 1,
    secretLuck: 1,
    infinityLuck: 1,
    shinyChance: 1 / 40,
    mythicChance: 1 / 100,
    xlChance: 1 / 500,
    hatchSpeed: 1,
  };
  export let eggsPerHatch = 1;
</script>

<div class="stats">
  <div class="stat">
    <SmartImage
      base="assets/images/icons/luck"
      alt="Luck"
      decoding="async"
      size="24px"
    />
    <strong>{formatChancePercent(stats.luck - 1, true, false, true)}</strong>
  </div>
  <div class="stat">
    <SmartImage
      base="assets/images/icons/secret-luck"
      alt="Secret Luck"
      decoding="async"
      size="24px"
    />
    <strong>{formatMultiplier(stats.secretLuck)}</strong>
  </div>
  <div class="stat">
    <SmartImage
      base="assets/images/icons/infinity-luck"
      alt="Infinity Luck"
      decoding="async"
      size="24px"
    />
    <strong>{formatMultiplier(stats.infinityLuck)}</strong>
  </div>
  <div class="stat">
    <SmartImage
      base="assets/images/icons/shiny"
      alt="Shiny Chance"
      decoding="async"
      size="24px"
    />
    <strong>{formatChanceFraction(stats.shinyChance)}</strong>
  </div>
  <div class="stat">
    <SmartImage
      base="assets/images/icons/mythic"
      alt="Mythic Chance"
      decoding="async"
      size="24px"
    />
    <strong>{formatChanceFraction(stats.mythicChance)}</strong>
  </div>
  <!-- <div class="stat">
    <SmartImage
      base="assets/images/icons/XL"
      alt="XL Chance"
      decoding="async"
      size="24px"
    />
    <strong>{formatChanceFraction(stats.xlChance)}</strong>
  </div> -->
  <div class="stat">
    <SmartImage
      base="assets/images/icons/shiny-mythic"
      alt="Shiny Mythic Chance"
      decoding="async"
      size="24px"
    />
    <strong
      >{formatChanceFraction(stats.shinyChance * stats.mythicChance)}</strong
    >
  </div>
  <div class="stat">
    <SmartImage
      base="assets/images/icons/timer"
      alt="Hatch Speed"
      decoding="async"
      size="24px"
    />
    <strong>{formatChancePercent(stats.hatchSpeed, true, true, true)}</strong>
  </div>
  <div class="stat">
    <SmartImage
      base="assets/images/icons/multi-egg"
      alt="Eggs Per Second"
      decoding="async"
      size="24px"
    />
    <strong
      >{calculateEggsPerSecond(stats.hatchSpeed, eggsPerHatch).toFixed(2)} / s</strong
    >
  </div>
</div>

<style>
  .stats {
    display: flex;
    justify-content: space-between;
    background: var(--menu-bg);
    box-shadow: var(--elevation);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    padding: 0.75rem 1rem;
    width: 100%;
    position: sticky;
    top: 0.15rem;
    z-index: 10;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    justify-content: center;
  }

  .stat strong {
    color: var(--primary-text);
    font-weight: 600;
    font-size: 0.9rem;
  }
</style>
