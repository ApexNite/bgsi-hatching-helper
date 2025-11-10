<script>
  import { dataStore, isDataLoaded, loadData } from "../../lib/dataStore.js";
  import { onMount } from "svelte";
  import { decode } from "blurhash";
  import { inview } from "svelte-inview";

  export let base;
  export let alt;
  export let decoding;
  export let size;

  const PLACEHOLDER_BASE = "assets/images/icons/pet-placeholder";
  const INVIEW_OPTIONS = {
    rootMargin: "50px",
    unobserveOnEnter: true,
  };

  let blurhash;
  let imageLoaded;
  let isInView;
  let canvasElement;

  let currentBase = base;
  let lastBaseProp = base;
  let usedPlaceholder = false;

  $: if (base !== lastBaseProp) {
    lastBaseProp = base;
    usedPlaceholder = false;
    currentBase = base;
    imageLoaded = false;
  }

  $: if ($isDataLoaded) {
    blurhash = $dataStore.imageMeta[`${currentBase}.png`];
  }

  $: if (blurhash && canvasElement && !imageLoaded) {
    renderBlurhash();
  }

  onMount(async () => {
    if (!$isDataLoaded) {
      await loadData();
    }
    if (blurhash && canvasElement && !imageLoaded) {
      renderBlurhash();
    }
  });

  function handleImageError() {
    if (usedPlaceholder) {
      return;
    }

    usedPlaceholder = true;
    currentBase = PLACEHOLDER_BASE;
    imageLoaded = false;
  }

  function handleInviewChange({ detail }) {
    isInView = detail.inView;
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
  const getColorIndicesForCoord = (x, y, width) => {
    const red = y * (width * 4) + x * 4;
    return [red, red + 1, red + 2, red + 3];
  };

  function getAverageColor(pixels, width, height) {
    const total = width * height;
    let r = 0;
    let g = 0;
    let b = 0;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const [redIndex, greenIndex, blueIndex] = getColorIndicesForCoord(
          x,
          y,
          width,
        );

        r += pixels[redIndex];
        g += pixels[greenIndex];
        b += pixels[blueIndex];
      }
    }

    return {
      r: Math.round(r / total),
      g: Math.round(g / total),
      b: Math.round(b / total),
    };
  }

  function renderBlurhash() {
    if (!blurhash || !canvasElement) {
      return;
    }

    const pixels = decode(blurhash.hash, blurhash.w, blurhash.h);
    const ctx = canvasElement.getContext("2d");
    const imageData = ctx.createImageData(blurhash.w, blurhash.h);

    const blackThreshold = 64;
    const dimFactor = 0.45;

    const avg = getAverageColor(pixels, blurhash.w, blurhash.h);

    const dimmed = {
      r: Math.round(avg.r * dimFactor),
      g: Math.round(avg.g * dimFactor),
      b: Math.round(avg.b * dimFactor),
    };

    for (let x = 0; x < imageData.width; x++) {
      for (let y = 0; y < imageData.height; y++) {
        const [redIndex, greenIndex, blueIndex, alphaIndex] =
          getColorIndicesForCoord(x, y, imageData.width);

        const r = pixels[redIndex];
        const g = pixels[greenIndex];
        const b = pixels[blueIndex];
        const a = pixels[alphaIndex];

        if (r >= blackThreshold || g >= blackThreshold || b >= blackThreshold) {
          imageData.data[redIndex] = r;
          imageData.data[greenIndex] = g;
          imageData.data[blueIndex] = b;
          imageData.data[alphaIndex] = a;
        } else {
          imageData.data[redIndex] = dimmed.r;
          imageData.data[greenIndex] = dimmed.g;
          imageData.data[blueIndex] = dimmed.b;
          imageData.data[alphaIndex] = 255;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }
</script>

<div
  class="wrapper"
  use:inview={INVIEW_OPTIONS}
  on:inview_change={handleInviewChange}
  style="width: {size}; height: {size};"
>
  {#if $isDataLoaded && blurhash && !imageLoaded}
    <canvas
      bind:this={canvasElement}
      width={blurhash.w}
      height={blurhash.h}
      style="width: {size}; height: {size};"
    ></canvas>
  {/if}
  {#if isInView}
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
  {/if}
</div>

<style>
</style>
