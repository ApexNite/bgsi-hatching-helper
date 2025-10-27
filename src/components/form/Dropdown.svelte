<script>
  import { onMount, onDestroy } from "svelte";
  import SmartImage from "../media/SmartImage.svelte";

  export let id = "";
  export let options = [];
  export let selectedOption = null;
  export let onSelect = null;

  let open = false;
  let root;

  $: if (!selectedOption && options.length > 0) {
    selectedOption = options[0];
  }

  function toggle() {
    open = !open;
  }

  function select(option) {
    selectedOption = option;
    onSelect && onSelect({ option, id });
    open = false;
  }

  function handleDocClick(e) {
    if (!open) {
      return;
    }

    if (!root.contains(e.target)) {
      open = false;
    }
  }

  onMount(() => document.addEventListener("mousedown", handleDocClick));
  onDestroy(() => document.removeEventListener("mousedown", handleDocClick));
</script>

<div class="wrapper" bind:this={root}>
  <button class="button-dropdown" type="button" on:click={toggle}>
    {#if selectedOption?.img}
    <span class="img-wrapper">
<SmartImage
        base={selectedOption.img}
        alt={selectedOption.name}
        decoding="async"
        size="26px"
      />
    </span>
      
    {:else}
      <span class="img-placeholder"></span>
    {/if}
    <span>{selectedOption?.name}</span>
  </button>

  {#if open}
    <div class="dropdown-menu">
      {#each options as option}
        <button
          class="dropdown-item"
          type="button"
          on:click={() => select(option)}
        >
          {#if option.img}
          <span class="img-wrapper">
            <SmartImage
              base={option.img}
              alt={option.name}
              decoding="lazy"
              size="26px"
            />
          </span>
          {/if}
          <span>{option.name}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .wrapper {
    display: inline-block;
    position: relative;
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
    border: 1.5px solid var(--border);
  }

  .dropdown-item {
    background: none;
    border: none;
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 40;
    display: flex;
    flex-direction: column;
    min-width: 100%;
    max-height: 320px;
    padding: 0.25rem 0;
    overflow-y: auto;
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
    margin-right: 0.5rem;
  }

  .img-placeholder {
    height: 30px;
  }
</style>
