<script>
  import {
    formatChancePercent,
    formatChanceFraction,
    formatMultiplier,
  } from "../../lib/formatUtils.js";
  import { calculateEggsPerSecond } from "../../lib/petUtils.js";
  import SmartImage from "../control/SmartImage.svelte";

  import tippy from "tippy.js";

  export let stats = {
    luck: 1,
    secretLuck: 1,
    infinityLuck: 1,
    shinyChance: 1 / 40,
    mythicChance: 1 / 100,
    getXlChanceForRarity: (rarity) => {
      return 1 / 200;
    },
    hatchSpeed: 1,
  };
  export let debugStats = null;
  export let eggsPerHatch = 1;
  export let hasIgnoreSecretPets = false;

  function tooltip(node, content) {
    const instance = tippy(node, { content, allowHTML: true });

    return {
      update(newContent) {
        instance.setContent(newContent);
      },
      destroy() {
        instance.destroy();
      },
    };
  }

  function headerLine(label, value, header = "In-Game Debug Stats") {
    if (!debugStats) {
      return label;
    }

    return `<div style="text-align:center;">
      <div>${label}</div>
      <div style="margin:4px 0;height:1px;background:rgba(255,255,255,0.15);"></div>
      <div style="opacity:0.85;font-size:0.85em;">${header}</div>
      <strong style="white-space:pre-line;">${value}</strong>
    </div>`;
  }
</script>

<div class="stats">
  <div
    class="stat"
    use:tooltip={headerLine(
      "Luck",
      debugStats &&
        formatChancePercent(debugStats.luck - 1, true, "floor", true),
    )}
  >
    <SmartImage
      base="assets/images/icons/luck"
      alt="Luck"
      decoding="async"
      size="24px"
    />
    <strong>{formatChancePercent(stats.luck - 1, true, "floor", true)}</strong>
  </div>
  <div
    class="stat"
    class:dimmed={hasIgnoreSecretPets}
    use:tooltip={headerLine(
      "Secret Luck",
      debugStats && formatMultiplier(debugStats.secretLuck, 3, "round"),
    )}
  >
    <SmartImage
      base="assets/images/icons/secret-luck"
      alt="Secret Luck"
      decoding="async"
      size="24px"
    />
    <strong>{formatMultiplier(stats.secretLuck, 3, "round")}</strong>
  </div>
  <div
    class="stat"
    class:dimmed={hasIgnoreSecretPets}
    use:tooltip={"Celestial Luck"}
  >
    <SmartImage
      base="assets/images/icons/celestial-luck"
      alt="Celestial Luck"
      decoding="async"
      size="24px"
    />
    <strong>{formatMultiplier(stats.celestialLuck, 2, "ceil")}</strong>
  </div>
  <div
    class="stat"
    class:dimmed={hasIgnoreSecretPets}
    use:tooltip={headerLine(
      "Infinity Luck",
      debugStats && formatMultiplier(debugStats.infinityLuck, 2, "ceil"),
    )}
  >
    <SmartImage
      base="assets/images/icons/infinity-luck"
      alt="Infinity Luck"
      decoding="async"
      size="24px"
    />
    <strong>{formatMultiplier(stats.infinityLuck, 2, "ceil")}</strong>
  </div>
  <div
    class="stat"
    use:tooltip={headerLine(
      "Shiny Chance",
      debugStats && formatChanceFraction(debugStats.shinyChance),
    )}
  >
    <SmartImage
      base="assets/images/icons/shiny"
      alt="Shiny Chance"
      decoding="async"
      size="24px"
    />
    <strong>{formatChanceFraction(stats.shinyChance)}</strong>
  </div>
  <div
    class="stat"
    use:tooltip={headerLine(
      "Mythic Chance",
      debugStats && formatChanceFraction(debugStats.mythicChance),
    )}
  >
    <SmartImage
      base="assets/images/icons/mythic"
      alt="Mythic Chance"
      decoding="async"
      size="24px"
    />
    <strong>{formatChanceFraction(stats.mythicChance)}</strong>
  </div>
  <div class="stat" use:tooltip={"Shiny Mythic Chance"}>
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
  <div
    class="stat"
    use:tooltip={headerLine(
      "XL Chance*",
      debugStats &&
        `Secret+: ${formatChanceFraction(debugStats.getXlChanceForRarity("secret"))}
        Legendary: ${formatChanceFraction(debugStats.getXlChanceForRarity("legendary"))}
        Epic: ${formatChanceFraction(debugStats.getXlChanceForRarity("epic"))}
        Rare: ${formatChanceFraction(debugStats.getXlChanceForRarity("rare"))}
        Unique: ${formatChanceFraction(debugStats.getXlChanceForRarity("unique"))}
        Common: ${formatChanceFraction(debugStats.getXlChanceForRarity("common"))}
        \n*XL buffs are currently\nbugged and instead lower\nyour chances`,
      "",
    )}
  >
    <SmartImage
      base="assets/images/icons/xl"
      alt="XL Chance"
      decoding="async"
      size="24px"
    />
    <strong>{formatChanceFraction(stats.getXlChanceForRarity("secret"))}</strong
    >
  </div>
  <div
    class="stat"
    use:tooltip={headerLine(
      "Hatch Speed",
      debugStats &&
        formatChancePercent(debugStats.hatchSpeed, true, "round", true),
    )}
  >
    <SmartImage
      base="assets/images/icons/timer"
      alt="Hatch Speed"
      decoding="async"
      size="24px"
    />
    <strong>{formatChancePercent(stats.hatchSpeed, true, "round", true)}</strong
    >
  </div>
  <div class="stat" use:tooltip={"Eggs Per Second"}>
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

  .stat.dimmed {
    opacity: 0.4;
  }
</style>
