<script>
  import { onMount, onDestroy } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { dataStore } from "../../lib/dataStore.js";
  import SmartImage from "../media/SmartImage.svelte";

  export let open = false;

  let root;
  let localBuildDate = new Date(__BUILD_DATE__).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  $: dataHash = $dataStore.dataHash || "Loading...";

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
        <h2 class="title">BGSI Hatching Helper</h2>

        <button type="button" class="icon-btn" on:click={() => (open = false)}>
          ✕
        </button>
      </header>

      <section class="grid">
        <div class="item">
          <h3>About</h3>
          <p>
            A calculator for Bubble Gum Simulator Infinity that helps you find
            hatching chances and times.
          </p>
        </div>

        <div class="item">
          <h3>Build</h3>
          <div class="meta">
            <div class="meta-row">
              <span class="label">Build Hash</span>
              <span class="badge mono">{__BUILD_HASH__}</span>
            </div>
            <div class="meta-row">
              <span class="label">Data Hash</span>
              <span class="badge mono">{dataHash}</span>
            </div>
            <div class="meta-row">
              <span class="label">Last Updated</span>
              <span class="badge">{localBuildDate}</span>
            </div>
          </div>
        </div>

        <div class="item">
          <h3>Attribution</h3>
          <ul>
            <li>Created by ApexLite</li>
            <li>UI Feedback from vtxp4nd4</li>
          </ul>
        </div>

        <div class="item">
          <h3>Links</h3>
          <nav class="links-nav">
            <a
              href="https://discord.gg/hmRJrchEgy"
              target="_blank"
              rel="noopener noreferrer"
              title="Discord"
              class="link-icon"
            >
              <SmartImage
                base="assets/images/icons/discord"
                alt="Discord"
                size="24px"
                decoding="async"
              />
            </a>
            <a
              href="https://github.com/ApexNite/bgsi-hatching-helper"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              class="link-icon"
            >
              <SmartImage
                base="assets/images/icons/github"
                alt="GitHub"
                size="24px"
                decoding="async"
              />
            </a>
          </nav>
        </div>
      </section>
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
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 0.5rem 1rem;
    margin-bottom: 0.75rem;
  }

  .title {
    min-width: 0;
    margin: 0;
  }

  .grid {
    display: grid;
    grid-template-columns: 1.25fr 1fr;
    gap: 1rem 1.5rem;
    margin-top: 0.25rem;
  }

  .item h3 {
    margin: 0.25rem 0 0.5rem 0;
    font-size: 1.05rem;
    font-weight: 600;
  }

  .item p {
    margin: 0.25rem 0 0.5rem 0;
    line-height: 1.5;
  }

  .item ul {
    margin: 0;
    padding-left: 0;
    opacity: 0.9;
    list-style: none;
  }

  .meta {
    display: grid;
    gap: 0.5rem;
  }

  .meta-row {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 0.75rem;
  }

  .label {
    color: var(--secondary-text);
    font-size: 0.9rem;
  }

  .badge {
    justify-self: start;
    padding: 0.25rem 0.5rem;
    border-radius: calc(var(--radius-md) - 2px);
    border: 1px solid var(--border);
    background: color-mix(in srgb, var(--menu-bg) 70%, var(--border));
    color: var(--primary-text);
    font-size: 0.9rem;
  }

  .mono {
    font-family: "Noto Sans Mono", monospace;
  }

  .links-nav {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .link-icon {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    background: none;
    border: 1px solid transparent;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;
  }

  .link-icon:hover {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    border-color: color-mix(in srgb, var(--accent) 35%, transparent);
  }
</style>
