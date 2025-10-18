<script>
  import { formatChancePercent, formatChanceFraction, formatMultiplier } from "../../lib/formatUtils.js";
  import { calculateEggsPerSecond } from "../../lib/petUtils.js";

  export let activeTab = "chances";
  export let stats = { luck: 1, secretLuck: 1, shinyChance: 1 / 40, mythicChance: 1 / 100, hatchSpeed: 1 };
  export let eggsPerHatch = 1;
</script>

<div class="stats">
  {#if activeTab === "chances"}
    <div class="stat">
      <picture>
          <source srcset="assets/images/icons/luck.avif" type="image/avif">
          <source srcset="assets/images/icons/luck.webp" type="image/webp">
          <img src="assets/images/icons/luck.png" alt="Luck" loading="lazy" decoding="async">
      </picture>
      <strong>{formatChancePercent(stats.luck - 1, true)}</strong>
    </div>
    <div class="stat">
      <picture>
          <source srcset="assets/images/icons/secret-luck.avif" type="image/avif">
          <source srcset="assets/images/icons/secret-luck.webp" type="image/webp">
          <img src="assets/images/icons/secret-luck.png" alt="Secret Luck" loading="lazy" decoding="async">
      </picture>
      <strong>{formatMultiplier(stats.secretLuck)}</strong>
    </div>
    <div class="stat">
      <picture>
          <source srcset="assets/images/icons/shiny.avif" type="image/avif">
          <source srcset="assets/images/icons/shiny.webp" type="image/webp">
          <img src="assets/images/icons/shiny.png" alt="Shiny Chance" loading="lazy" decoding="async">
      </picture>
      <strong>{formatChanceFraction(stats.shinyChance)}</strong>
    </div>
    <div class="stat">
      <picture>
          <source srcset="assets/images/icons/mythic.avif" type="image/avif">
          <source srcset="assets/images/icons/mythic.webp" type="image/webp">
          <img src="assets/images/icons/mythic.png" alt="Mythic Chance" loading="lazy" decoding="async">
      </picture>
      <strong>{formatChanceFraction(stats.mythicChance)}</strong>
    </div>
    <div class="stat">
      <picture>
          <source srcset="assets/images/icons/shiny-mythic.avif" type="image/avif">
          <source srcset="assets/images/icons/shiny-mythic.webp" type="image/webp">
          <img src="assets/images/icons/shiny-mythic.png" alt="Shiny Mythic Chance" loading="lazy" decoding="async">
      </picture>
      <strong>{formatChanceFraction(stats.shinyChance * stats.mythicChance)}</strong>
    </div>
  {/if}
  {#if activeTab === "times"}
    <div class="stat">
      <picture>
          <source srcset="assets/images/icons/timer.avif" type="image/avif">
          <source srcset="assets/images/icons/timer.webp" type="image/webp">
          <img src="assets/images/icons/timer.png" alt="Hatch Speed" loading="lazy" decoding="async">
      </picture>
      <strong>{formatChancePercent(stats.hatchSpeed, true, true)}</strong>
    </div>
    <div class="stat">
      <picture>
          <source srcset="assets/images/icons/multi-egg.avif" type="image/avif">
          <source srcset="assets/images/icons/multi-egg.webp" type="image/webp">
          <img src="assets/images/icons/multi-egg.png" alt="Eggs Per Second" loading="lazy" decoding="async">
      </picture>
      <strong>{calculateEggsPerSecond(stats.hatchSpeed, eggsPerHatch).toFixed(2)} / s</strong>
    </div>
  {/if}
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
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    justify-content: center;
  }

  .stat img {
    width: 24px;
    height: 24px;
  }

  .stat strong {
    color: var(--primary-text);
    font-weight: 600;
    font-size: 0.9rem;
  }
</style>