<script>
  import { onMount, onDestroy } from "svelte";
  import { fade, fly } from "svelte/transition";

  export let open = false;

  let root;

  function handleDocClick(e) {
    if (open && root && !root.contains(e.target)) {
      open = false;
    }
  }

  onMount(() => document.addEventListener("mousedown", handleDocClick));
  onDestroy(() => document.removeEventListener("mousedown", handleDocClick));
</script>

{#if open}
  <div class="overlay" transition:fade={{ duration: 180 }}>
    <div
      class="info-card"
      bind:this={root}
      transition:fly={{ y: 16, duration: 180 }}
    >
      <header class="header">
        <button type="button" class="icon-btn" on:click={() => (open = false)}>
          ✕
        </button>
      </header>

      <div class="content">
        <div class="error-icon">⚠️</div>
        <h2>Incomplete XL Chances</h2>
        <p>
          XL chances are currently not available for all rarities. We're working to figure out the correct odds and will update them as soon as possible.
          <br /><br />
          Sorry for the inconvenience!
        </p>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: grid;
    place-items: center;
    z-index: 1000;
    padding: 1rem;
  }

  .info-card {
    background: var(--menu-bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    position: relative;
    padding: 1.25rem 1.25rem 1.5rem;
    width: min(90vw, 720px);
  }

  .icon-btn {
    background: none;
    border: 1px solid transparent;
    color: var(--primary-text);
    cursor: pointer;
    width: 32px;
    height: 32px;
    font-size: 1.25rem;
    line-height: 1;
    border-radius: var(--radius-md);
    display: grid;
    place-items: center;
    transition:
      transform 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
  }

  .icon-btn:hover {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    border-color: color-mix(in srgb, var(--accent) 35%, transparent);
  }

  .icon-btn:active {
    transform: scale(0.97);
  }

  .header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 0.75rem;
  }

  .content {
    padding: 1rem;
    text-align: center;
    overflow-wrap: anywhere;
  }

  .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .content h2 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .content p {
    margin: 0 0 1.5rem 0;
    line-height: 1.5;
  }
</style>
