<script>
  export let id = "";
  export let value = 0;
  export let maxValue = Number.MAX_VALUE;
  export let onInput = null;
  export let hoverText = "";

  const MAX_LEN = 12;

  let text = "";
  let userChanged = false;

  $: {
    const normalized = Math.min(value ?? 0, maxValue);

    if (!userChanged) {
      text = sanitize(normalized);
    } else if (toNumber(text) !== normalized) {
      text = sanitize(normalized);
    }
  }

  const toNumber = (s) => (s && s !== "." ? Number(s) : 0);

  function sanitize(input) {
    return String(input ?? "")
      .replace(/[^\d.]/g, "")
      .replace(/\.(?=.*\.)/g, "")
      .slice(0, MAX_LEN);
  }

  function handleInput(e) {
    userChanged = true;

    const raw = e.target.value;
    const next = sanitize(raw);
    const nextValue = Math.min(toNumber(next), maxValue);

    text = nextValue === toNumber(next) ? next : String(nextValue);

    e.target.value = text;

    onInput?.({ value: nextValue, text, id });
  }
</script>

<div class="wrapper">
  <input
    type="text"
    class="number-input"
    value={text}
    on:input={handleInput}
    autocomplete="off"
    inputmode="decimal"
    pattern="[0-9]*[.,]?[0-9]*"
    maxlength={MAX_LEN}
    title={hoverText}
  />
</div>

<style>
  .wrapper {
    display: inline-block;
  }

  .number-input {
    width: 180px;
    min-height: 45px;
    padding: 0.5rem 1rem;
    font-size: 1.05rem;
    background: var(--menu-bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    appearance: textfield;
    outline: none;
    transition: background-color 0.2s ease;
  }

  .number-input:hover,
  .number-input:focus-visible {
    background-color: color-mix(in srgb, var(--accent) 5%, var(--menu-bg));
  }
</style>
