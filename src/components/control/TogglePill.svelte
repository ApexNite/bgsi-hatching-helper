<script>
  export let id;
  export let checked = false;
  export let onLabel = "On";
  export let offLabel = "Off";
  export let onIcon = "";
  export let offIcon = "";
  export let onChange = null;

  function handleToggle() {
    onChange?.({ id, checked: !checked });
  }

  function handleKeydown(e) {    
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleToggle();
    }
  }
</script>

<button
  class="toggle-pill"
  on:click={handleToggle}
  on:keydown={handleKeydown}
>
  {#if checked ? onIcon : offIcon}
    <span class="pill-icon">{checked ? onIcon : offIcon}</span>
  {/if}
  <span>{checked ? onLabel : offLabel}</span>
</button>

<style>
  .toggle-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--menu-bg);
    border: 1.5px solid var(--border);
    border-radius: 16px;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--secondary-text);
  }

  .toggle-pill:hover {
    background: color-mix(in srgb, var(--accent) 5%, var(--menu-bg));
  }

  .pill-icon {
    font-size: 1rem;
    line-height: 1;
  }
</style>
