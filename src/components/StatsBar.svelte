<script>
  import { formatChancePercent, formatChanceFraction, formatMultiplier } from "../lib/formatUtils.js";
  import { calculateEggsPerSecond } from "../lib/petUtils.js";

  export let activeTab = "chances";
  export let stats = { luck: 1, secretLuck: 1, shinyChance: 1 / 40, mythicChance: 1 / 100, hatchSpeed: 1, eggsPerHatch: 1 };
</script>

<div class="stats">
  {#if activeTab === "chances"}
    <div class="stat">
      <img src="icons/luck.png" alt="Luck" />
      <strong>{formatChancePercent(stats.luck)}</strong>
    </div>
    <div class="stat">
      <img src="icons/secret-luck.png" alt="Secret Luck" />
      <strong>{formatMultiplier(stats.secretLuck)}</strong>
    </div>
    <div class="stat">
      <img src="icons/shiny.png" alt="Shiny Chance" />
      <strong>{formatChanceFraction(stats.shinyChance)}</strong>
    </div>
    <div class="stat">
      <img src="icons/mythic.png" alt="Mythic Chance" />
      <strong>{formatChanceFraction(stats.mythicChance)}</strong>
    </div>
    <div class="stat">
      <img src="icons/shiny-mythic.png" alt="Shiny Mythic Chance" />
      <strong>{formatChanceFraction(stats.shinyChance * stats.mythicChance)}</strong>
    </div>
  {/if}
  {#if activeTab === "times"}
    <div class="stat">
      <img src="icons/timer.png" alt="Hatch Speed" />
      <strong>{formatChancePercent(stats.hatchSpeed)}</strong>
    </div>
    <div class="stat">
      <img src="icons/multi-egg.png" alt="Eggs Per Second" />
      <strong>{calculateEggsPerSecond(stats.hatchSpeed, stats.eggsPerHatch).toFixed(2)} / s</strong>
    </div>
  {/if}
</div>

<style>
.stats {
  display: flex;
  justify-content: space-between;
  background: var(--menu-bg);
  box-shadow: var(--elevation-2);
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
  object-fit: contain;
}

.stat strong {
  color: var(--primary-text);
  font-weight: 600;
  font-size: 0.9rem;
}
</style>