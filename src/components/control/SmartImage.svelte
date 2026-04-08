<script>
  import { inview } from "svelte-inview";

  export let base;
  export let placeholder = "icon";
  export let alt;
  export let decoding;
  export let size;
  export let zoom = 1;
  export let overlayBase = null;
  export let overlayAlt = "";
  export let overlaySize = "10px";
  export let overlayPosition = "bottom-right";
  export let overlayInset = "0px";

  const INVIEW_OPTIONS = {
    rootMargin: "35%",
    unobserveOnEnter: true,
  };

  let isInView;
  let imageError;
  let imageLoaded;

  let overlayError;

  let placeholderBase = `assets/images/placeholders/${placeholder}`;

  $: currentBase = isInView && !imageError ? base : placeholderBase;
  $: safeZoom = typeof zoom === "number" && zoom > 0 ? zoom : 1;

  $: showOverlay = Boolean(isInView && overlayBase && !overlayError);

  $: overlayPosStyle =
    overlayPosition === "bottom-right"
      ? `right: ${overlayInset}; bottom: ${overlayInset};`
      : overlayPosition === "top-left"
        ? `left: ${overlayInset}; top: ${overlayInset};`
        : overlayPosition === "top-right"
          ? `right: ${overlayInset}; top: ${overlayInset};`
          : `left: ${overlayInset}; bottom: ${overlayInset};`;

  function handleImageError() {
    if (imageError) {
      return;
    }

    imageError = true;
    currentBase = placeholderBase;
  }

  function handleOverlayError() {
    if (overlayError) {
      return;
    }

    overlayError = true;
  }

  function handleInviewChange({ detail }) {
    isInView = detail.inView;
  }
</script>

<div
  class="wrapper"
  use:inview={INVIEW_OPTIONS}
  on:inview_change={handleInviewChange}
  style="width: {size}; height: {size}; --zoom: {safeZoom};"
>
  <picture class:hidden={!imageLoaded} class="main">
    <source srcset={`${currentBase}.avif`} type="image/avif" />
    <source srcset={`${currentBase}.webp`} type="image/webp" />
    <img
      src={`${currentBase}.png`}
      {alt}
      {decoding}
      on:load={() => (imageLoaded = true)}
      on:error={handleImageError}
    />
  </picture>

  {#if showOverlay}
    <picture
      class="overlay"
      style="{overlayPosStyle} width: {overlaySize}; height: {overlaySize};"
      aria-hidden={overlayAlt ? undefined : "true"}
    >
      <source srcset={`${overlayBase}.avif`} type="image/avif" />
      <source srcset={`${overlayBase}.webp`} type="image/webp" />
      <img
        src={`${overlayBase}.png`}
        alt={overlayAlt}
        decoding="async"
        on:error={handleOverlayError}
      />
    </picture>
  {/if}
</div>

<style>
  .wrapper {
    position: relative;
    overflow: hidden;
  }

  picture {
    width: 100%;
    height: 100%;
    display: block;
  }

  .main {
    transform: scale(var(--zoom, 1));
    transform-origin: center center;
    will-change: transform;
  }

  img {
    width: 100%;
    height: 100%;
    display: block;
  }

  .hidden {
    display: none;
  }

  .overlay {
    position: absolute;
    z-index: 2;
    pointer-events: none;
  }
</style>
