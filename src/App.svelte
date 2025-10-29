<script>
  import { onMount } from "svelte";
  import { loadData, isDataLoaded, dataError } from "./lib/dataStore.js";
  import UserInput from "./components/containers/UserInput.svelte";
  import StatsBar from "./components/bars/StatsBar.svelte";
  import PetTable from "./components/tables/PetTable.svelte";

  let stats;
  let eggsPerHatch;
  let selectedEggId;
  let selectedWorldId;

  onMount(() => {
    loadData();
  });
</script>

{#if $dataError}
  <div class="center-container">
    <div class="error-card">
      <div class="error-icon">⚠️</div>
      <h2>Unable to Load Data</h2>
      <p>{$dataError}</p>
      <button class="retry-btn" on:click={() => loadData()}> Try Again </button>
    </div>
  </div>
{:else if $isDataLoaded}
  <main class="container">
    <div class="left-pane">
      <UserInput
        bind:stats
        bind:eggsPerHatch
        bind:selectedEggId
        bind:selectedWorldId
      />
    </div>

    <section class="right-pane">
      <StatsBar {stats} {eggsPerHatch} />

      <PetTable {stats} {eggsPerHatch} {selectedEggId} {selectedWorldId} />
    </section>
  </main>
{:else}
  <div class="center-container">
    <div class="loading-card">
      <div class="spinner"></div>
      <p>Loading data...</p>
    </div>
  </div>
{/if}

<style>
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
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
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
    .right-pane {
      flex: 0 0 auto;
    }

    .center-container {
      padding: 0.5rem;
    }

    .loading-card,
    .error-card {
      padding: 1.5rem;
    }
  }
</style>
