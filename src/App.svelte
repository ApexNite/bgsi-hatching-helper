<script>
  import './debug.js';
  import { onMount, afterUpdate, tick } from "svelte";
  import { loadData, isDataLoaded, dataError } from "./lib/dataStore.js";
  import UserInput from "./components/containers/UserInput.svelte";
  import StatsBar from "./components/bars/StatsBar.svelte";
  import PetTable from "./components/tables/PetTable.svelte";
  import SmartImage from "./components/media/SmartImage.svelte";
  import InfoOverlay from "./components/overlays/InfoOverlay.svelte";

  let stats;
  let eggsPerHatch;
  let selectedEggId;
  let selectedWorldId;
  let showInfo = false;

  let leftPane;
  let rightPane;
  let addBottomSpace = false;

  async function checkPaneHeights() {
    await tick();
    addBottomSpace = rightPane?.offsetHeight > leftPane?.offsetHeight;
  }

  onMount(() => {
    loadData();
  });

  // Deprecated but not switching to $effect for now
  afterUpdate(checkPaneHeights);
</script>

<main class:add-bottom-space={addBottomSpace}>
  {#if $dataError}
    <div class="center-container">
      <div class="error-card">
        <div class="error-icon">⚠️</div>
        <h2>Unable to Load Data</h2>
        <p>{$dataError}</p>
        <button class="retry-btn" on:click={() => loadData()}>
          Try Again
        </button>
      </div>
    </div>
  {:else if $isDataLoaded}
    <div class="container">
      <div class="left-pane" bind:this={leftPane}>
        <UserInput
          bind:stats
          bind:eggsPerHatch
          bind:selectedEggId
          bind:selectedWorldId
        />
      </div>

      <section class="right-pane" bind:this={rightPane}>
        <StatsBar {stats} {eggsPerHatch} />

        <PetTable
          {stats}
          {eggsPerHatch}
          {selectedEggId}
          {selectedWorldId}
          onSettingsChange={checkPaneHeights}
        />
      </section>
    </div>

    <div class="info-container">
      <button class="info-btn" on:click={() => (showInfo = true)}>
        <SmartImage
          base="assets/images/icons/info"
          alt="info"
          decoding="async"
          size="32px"
        />
      </button>
    </div>

    <InfoOverlay bind:open={showInfo} />
  {:else}
    <div class="center-container">
      <div class="loading-card">
        <div class="spinner"></div>
        <p>Loading data...</p>
      </div>
    </div>
  {/if}
</main>

<style>
  main.add-bottom-space {
    padding-bottom: 3.5rem;
  }

  .container {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    width: 100%;
    margin: 0.5rem 0 0;
  }

  .left-pane {
    flex: 0 0 auto;
  }

  .right-pane {
    flex: 1 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
  }

  .info-container {
    background: var(--menu-bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 100;
    transition: transform 0.2s ease;
  }

  .info-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }

  .info-container:hover {
    transform: scale(1.03);
  }

  .info-container:active {
    transform: scale(0.97);
  }

  .center-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 98vh;
    padding: 1rem;
  }

  .loading-card,
  .error-card {
    background: var(--menu-bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    padding: 2rem;
    text-align: center;
    max-width: 400px;
    width: 100%;
  }

  .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .error-card h2 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .error-card p {
    margin: 0 0 1.5rem 0;
    line-height: 1.5;
  }

  .retry-btn {
    background: var(--menu-bg);
    border: 1.5px solid var(--border);
    color: var(--primary-text);
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s ease;
  }

  .retry-btn:hover {
    background: color-mix(in srgb, var(--accent) 5%, var(--menu-bg));
  }

  .loading-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .loading-card p {
    margin: 0;
    font-size: 1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border);
    border-top: 3px solid var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 600px) {
    .center-container {
      padding: 0.5rem;
    }

    .loading-card,
    .error-card {
      padding: 1.5rem;
    }
  }
</style>
