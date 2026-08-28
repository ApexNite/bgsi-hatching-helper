<script>
  import { onMount, onDestroy } from "svelte";
  import SmartImage from "./SmartImage.svelte";

  export let id = "";
  export let options = [];
  export let selectedOptions = [];
  export let onChange = null;

  let open = false;
  let root;

  $: normalizedSelectedOptions = Array.isArray(selectedOptions)
    ? selectedOptions.filter(Boolean)
    : [];

  $: selectedIds = new Set(
    normalizedSelectedOptions.map((option) => option.id),
  );

  $: selectedLabel = (() => {
    if (!normalizedSelectedOptions.length) {
      return "None";
    }

    const names = normalizedSelectedOptions.map((option) => option.name);
    return names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0];
  })();

  $: selectedImageOptions = normalizedSelectedOptions.filter(
    (option) => option.img,
  );

  function toggle() {
    open = !open;
  }

  function selectOption(option) {
    const nextSelectedOptions = selectedIds.has(option.id)
      ? normalizedSelectedOptions.filter(
          (selected) => selected.id !== option.id,
        )
      : [...normalizedSelectedOptions, option];

    onChange && onChange({ id, options: nextSelectedOptions });
  }

  function clearSelection() {
    onChange && onChange({ id, options: [] });
  }

  function handleDocClick(event) {
    if (open && root && !root.contains(event.target)) {
      open = false;
    }
  }

  onMount(() => document.addEventListener("mousedown", handleDocClick));
  onDestroy(() => document.removeEventListener("mousedown", handleDocClick));
</script>

<div class="wrapper" bind:this={root}>
  <button
    class="button-dropdown"
    type="button"
    on:click={toggle}
    title={selectedLabel}
  >
    <span class="button-content">
      {#if selectedImageOptions.length}
        <span class="selected-icons" aria-label={selectedLabel}>
          {#each selectedImageOptions.slice(0, 3) as option (option.id)}
            <span class="selected-icon">
              <SmartImage
                base={option.img}
                alt={option.name}
                decoding="async"
                size="26px"
              />
            </span>
          {/each}
          {#if selectedImageOptions.length > 3}
            <span class="selected-count"
              >+{selectedImageOptions.length - 3}</span
            >
          {/if}
        </span>
      {:else}
        <span class="button-label">{selectedLabel}</span>
      {/if}
    </span>
    <span class="button-caret">{open ? "▴" : "▾"}</span>
  </button>

  {#if open}
    <div class="dropdown-menu">
      <button
        class="dropdown-item dropdown-item-clear"
        type="button"
        on:click={clearSelection}
      >
        <span>None</span>
      </button>

      {#each options as option (option.id)}
        <button
          class:selected={selectedIds.has(option.id)}
          class="dropdown-item"
          type="button"
          on:click={() => selectOption(option)}
        >
          <span class:filled={selectedIds.has(option.id)} class="item-box">
          </span>
          {#if option.img}
            <span class="img-wrapper">
              <SmartImage
                base={option.img}
                alt={option.name}
                decoding="async"
                size="26px"
              />
            </span>
          {/if}
          <span class="item-label">{option.name}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .wrapper {
    display: inline-block;
    position: relative;
    width: max-content;
    max-width: 100%;
  }

  .button-dropdown,
  .dropdown-item {
    display: flex;
    align-items: center;
    min-width: 180px;
    min-height: 45px;
    padding: 0.5rem 1rem;
    font-size: 1.05rem;
    background: var(--menu-bg);
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .button-dropdown {
    justify-content: space-between;
    gap: 0.75rem;
    border: 1.5px solid var(--border);
    width: 100%;
  }

  .button-content {
    display: flex;
    align-items: center;
    min-width: 0;
    overflow: hidden;
  }

  .button-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .button-caret {
    flex: 0 0 auto;
    opacity: 0.8;
  }

  .selected-icons {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
  }

  .selected-icon {
    flex: 0 0 auto;
    display: inline-flex;
  }

  .selected-count {
    flex: 0 0 auto;
    padding-left: 0.15rem;
    white-space: nowrap;
  }

  .dropdown-item {
    width: 100%;
    justify-content: flex-start;
    gap: 0.5rem;
    background: none;
    border: none;
    text-align: left;
  }

  .dropdown-item-clear {
    border-bottom: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
    margin-bottom: 0.15rem;
    border-radius: 0;
  }

  .dropdown-item.selected {
    background: color-mix(in srgb, var(--accent) 12%, var(--menu-bg));
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 40;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: 320px;
    padding: 0;
    overflow-y: auto;
    overflow-x: hidden;
    background: var(--menu-bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--elevation-2);
  }

  .button-dropdown:hover,
  .button-dropdown:focus,
  .dropdown-item:hover,
  .dropdown-item:focus {
    background: color-mix(in srgb, var(--accent) 5%, var(--menu-bg));
  }

  .img-wrapper {
    flex: 0 0 auto;
  }

  .item-box {
    position: relative;
    flex: 0 0 auto;
    width: 20px;
    height: 20px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--menu-bg);
    transition: background-color 0.2s ease;
  }

  .item-box::after {
    content: "";
    position: absolute;
    width: 6px;
    height: 10px;
    border: solid var(--accent);
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    opacity: 0;
    transition: opacity 0.2s ease;
    top: 45%;
    left: 50%;
    margin: -5px 0 0 -3px;
  }

  .item-box.filled {
    background: color-mix(in srgb, var(--accent) 5%, var(--menu-bg));
    border-color: var(--accent);
  }

  .item-box.filled::after {
    opacity: 1;
  }

  .item-label {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
