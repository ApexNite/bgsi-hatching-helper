<script>
  export let activeTab = "chances";
</script>

<div class="tab-switcher">
  <button
    class="tab-button"
    class:activeTab={activeTab === "chances"}
    on:click={() => activeTab = "chances"}
  >
    Hatching Chances
  </button>
  <button
    class="tab-button"
    class:activeTab={activeTab === "times"}
    on:click={() => activeTab = "times"}
  >
    Hatching Times
  </button>
</div>

<style>
.tab-switcher {
  display: flex;
  width: 100%;
  background: var(--menu-bg);
  box-shadow: var(--elevation);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  padding: 4px;
  gap: 4px;
}

.tab-button {
  flex: 1;
  background: none;
  border: none;
  color: var(--primary-text);
  font-weight: 500;
  font-size: 1.05rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.tab-button:hover {
    background-color: color-mix(in srgb, var(--accent) 5%, var(--menu-bg));
}

.tab-button.activeTab {
  background: color-mix(in srgb, var(--accent) 10%, var(--menu-bg));
}
</style>
