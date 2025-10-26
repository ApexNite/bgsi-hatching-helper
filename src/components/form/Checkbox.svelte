<script>
  export let id = "";
  export let checked = false;
  export let onChange = null;
  export let size = "md";

  $: styleVars =
    size === "sm"
      ? "--hit-size:28px; --box-size:20px; --check-w:6px; --check-h:10px; --check-top:45%;"
      : "--hit-size:45px; --box-size:32px; --check-w:12px; --check-h:18px; --check-top:40%;";
  function handleChange(event) {
    if (onChange) {
      onChange(event.target.checked);
    }
  }
</script>

<div class="wrapper" style={styleVars}>
  <label class="checkbox-label">
    <input type="checkbox" {id} bind:checked on:change={handleChange} />
    <span class="custom-checkbox"></span>
  </label>
</div>

<style>
  .wrapper {
    display: inline-block;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--hit-size, 45px);
    height: var(--hit-size, 45px);
    cursor: pointer;
  }

  input[type="checkbox"] {
    position: absolute;
    opacity: 0;
  }

  .custom-checkbox {
    position: relative;
    width: var(--box-size, 32px);
    height: var(--box-size, 32px);
    background: var(--menu-bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    transition: background-color 0.2s ease;
  }

  .custom-checkbox::after {
    content: "";
    position: absolute;
    width: var(--check-w, 12px);
    height: var(--check-h, 18px);
    border: solid var(--accent);
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    opacity: 0;
    transition: opacity 0.2s ease;
    top: var(--check-top, 40%);
    left: 50%;
    margin: calc(-1 * (var(--check-h, 18px) / 2)) 0 0
      calc(-1 * (var(--check-w, 12px) / 2));
  }

  input[type="checkbox"]:checked + .custom-checkbox {
    background: color-mix(in srgb, var(--accent) 5%, var(--menu-bg));
    border-color: var(--accent);
  }

  input[type="checkbox"]:checked + .custom-checkbox::after {
    opacity: 1;
  }

  .checkbox-label:hover .custom-checkbox {
    background: color-mix(in srgb, var(--accent) 5%, var(--menu-bg));
  }
</style>
