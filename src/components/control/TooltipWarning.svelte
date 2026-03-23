<script>
  export let text = "";
  export let icon = "⚠️";
</script>

<span class="tooltip-wrap">
  <span class="trigger">{icon}</span>
  <span class="tooltip">{text}</span>
</span>

<style>
  .tooltip-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    margin-left: 0.35rem;
    vertical-align: middle;
    cursor: help;
  }

  .trigger {
    font-size: 0.9rem;
    line-height: 1;
  }

  .tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    transform: translateY(4px);
    min-width: 180px;
    max-width: min(280px, calc(100vw - 2rem));
    padding: 0.5rem 0.6rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    background: var(--menu-bg);
    color: var(--primary-text);
    box-shadow: var(--elevation);
    font-size: 0.8rem;
    line-height: 1.35;
    white-space: normal;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
    z-index: 25;
  }

  .tooltip-wrap:hover .tooltip,
  .tooltip-wrap:focus-within .tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
</style>
