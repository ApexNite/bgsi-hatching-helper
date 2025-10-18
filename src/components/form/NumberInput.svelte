<script>
  export let id = "";
  export let value = 0;
  export let onInput = null;
  export let hoverText = "";

  function sanitize(str) {
    let s = String(str ?? "");
    s = s.replace(/[^0-9.]/g, "");
    const parts = s.split(".");
    if (parts.length > 2) {
      s = parts[0] + "." + parts.slice(1).join("");
    }
    s = s.slice(0, 12);
    return s;
  }

  let text = sanitize(value);

  $: if (Number(text) !== value) {
    text = sanitize(value);
  }

  function handleInput(event) {
    const raw = event.target.value;
    const next = sanitize(raw);

    text = next;

    let numeric = 0;
    if (next !== "" && next !== ".") {
      numeric = Number(next);
    } else {
      numeric = 0;
    }

    value = numeric;

    if (onInput) {
      onInput({ value: numeric, text: next, id });
    }
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
    maxlength={12}
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
