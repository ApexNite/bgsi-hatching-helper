<script>
  import { inview } from "svelte-inview";

  export let base;
  export let placeholder = "icon";
  export let alt;
  export let decoding;
  export let size;
  export let zoom = 1;

  const INVIEW_OPTIONS = {
    rootMargin: "35%",
    unobserveOnEnter: true,
  };

  let isInView;
  let imageError;
  let imageLoaded;
  let placeholderBase = `assets/images/placeholders/${placeholder}`;

  $: currentBase = isInView && !imageError ? base : placeholderBase;
  $: safeZoom = typeof zoom === "number" && zoom > 0 ? zoom : 1;

  function handleImageError() {
    if (imageError) {
      return;
    }

    imageError = true;
    currentBase = placeholderBase;
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
  <picture class:hidden={!imageLoaded}>
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
</style>
