<script>
  import UserInput from "./components/UserInput.svelte";
  import TabSwitcher from "./components/TabSwitcher.svelte";
  import StatsBar from "./components/StatsBar.svelte";
  import PetTable from "./components/PetTable.svelte";

  let activeTab = "chances";
  let stats = null;
  let selectedEggId = null;
  let selectedWorldId = null;
</script>

<main class="container">
  <div class="left-pane">
    <UserInput
      bind:stats
      bind:selectedEggId
      bind:selectedWorldId
    />
  </div>

  <section class="right-pane">
    <TabSwitcher bind:activeTab={activeTab} />

    <StatsBar {activeTab} {stats} />

    <PetTable
      {activeTab}
      {stats}
      {selectedEggId}
      {selectedWorldId}
    />
  </section>
</main>

<style>
.container {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  align-items: flex-start;
  justify-content: flex-start;
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
</style>
