<script>
  import { inview } from "svelte-inview";

  export let base;
  export let placeholder = "icon";
  export let alt;
  export let decoding;
  export let size;

  const INVIEW_OPTIONS = {
    rootMargin: "35%",
    unobserveOnEnter: true,
  };

  let isInView;
  let imageError;
  let imageLoaded;
  let placeholderBase = `assets/images/placeholders/${placeholder}`;

  $: currentBase = isInView && !imageError ? base : placeholderBase;

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
  style="width: {size}; height: {size};"
>
  <picture style={imageLoaded ? "" : "display:none"}>
    <source srcset={`${currentBase}.avif`} type="image/avif" />
    <source srcset={`${currentBase}.webp`} type="image/webp" />
    <img
      src={`${currentBase}.png`}
      {alt}
      {decoding}
      on:load={() => (imageLoaded = true)}
      on:error={handleImageError}
      style="width: {size}; height: {size};"
    />
  </picture>
</div>

<style>
</style>
