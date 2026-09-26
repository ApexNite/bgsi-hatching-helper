<script>
  import { onMount, onDestroy } from "svelte";
  import SmartImage from "./SmartImage.svelte";

  export let pets = [];
  export let selectedIds = [];
  export let onToggle = null;

  let open = false;
  let root;

  $: selectedSet = new Set(selectedIds);
  $: selectedPets = pets.filter((pet) => selectedSet.has(pet.id));

  function toggle() {
    open = !open;
  }

  function selectPet(pet) {
    onToggle && onToggle(pet.id);
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
  <div class="chips">
    {#each selectedPets as pet (pet.id)}
      <button
        class="chip"
        type="button"
        title={`Remove ${pet.name}`}
        on:click={() => selectPet(pet)}
      >
        <SmartImage
          base={pet.img}
          placeholder="pet"
          alt={pet.name}
          decoding="async"
          size="100%"
        />
        <span class="chip-remove">✕</span>
      </button>
    {/each}

    <button
      class="add-btn"
      type="button"
      title="Add bounty pet"
      on:click={toggle}
    >
      +
    </button>
  </div>

  {#if open}
    <div class="dropdown-menu">
      {#if pets.length === 0}
        <div class="empty-note">No bounty pets available</div>
      {/if}

      {#each pets as pet (pet.id)}
        <button
          class:selected={selectedSet.has(pet.id)}
          class="dropdown-item"
          type="button"
          on:click={() => selectPet(pet)}
        >
          <span class:filled={selectedSet.has(pet.id)} class="item-box"></span>
          <span class="img-wrapper">
            <SmartImage
              base={pet.img}
              placeholder="pet"
              alt={pet.name}
              decoding="async"
              size="26px"
            />
          </span>
          <span class="item-label">{pet.name}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .wrapper {
    position: relative;
    display: inline-block;
  }

  .chips {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .chip,
  .add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
    background: var(--menu-bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
  }

  .chip {
    position: relative;
    overflow: hidden;
  }

  .chip:hover {
    border-color: var(--accent);
  }

  .chip-remove {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--menu-bg) 70%, transparent);
    font-size: 0.75rem;
    line-height: 1;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .chip:hover .chip-remove {
    opacity: 1;
  }

  .add-btn {
    color: var(--accent);
    font-size: 1.1rem;
    font-weight: 700;
  }

  .add-btn:hover {
    background: color-mix(in srgb, var(--accent) 5%, var(--menu-bg));
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 40;
    display: flex;
    flex-direction: column;
    width: 200px;
    max-height: 260px;
    padding: 0.25rem;
    overflow-y: auto;
    background: var(--menu-bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--elevation-2);
  }

  .empty-note {
    padding: 0.5rem;
    font-size: 0.9rem;
    opacity: 0.7;
    text-align: center;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    min-height: 40px;
    padding: 0.4rem 0.5rem;
    background: none;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    text-align: left;
    cursor: pointer;
  }

  .dropdown-item:hover {
    background: color-mix(in srgb, var(--accent) 5%, var(--menu-bg));
  }

  .dropdown-item.selected {
    background: color-mix(in srgb, var(--accent) 12%, var(--menu-bg));
  }

  .img-wrapper {
    flex: 0 0 auto;
    display: flex;
  }

  .item-box {
    position: relative;
    flex: 0 0 auto;
    width: 18px;
    height: 18px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--menu-bg);
  }

  .item-box::after {
    content: "";
    position: absolute;
    top: 45%;
    left: 50%;
    width: 5px;
    height: 9px;
    margin: -5px 0 0 -3px;
    border: solid var(--accent);
    border-width: 0 2px 2px 0;
    opacity: 0;
    transform: rotate(45deg);
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
