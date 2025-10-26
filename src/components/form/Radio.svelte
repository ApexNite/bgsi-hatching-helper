<script>
  export let id = "";
  export let name = "";
  export let value = "";
  export let checked = false;
  export let onChange = null;
  export let size = "md";

  $: styleVars =
    size === "sm"
      ? "--hit-size:28px; --circle-size:20px; --dot-size:8px;"
      : "--hit-size:45px; --circle-size:32px; --dot-size:10px;";

  function handleChange(event) {
    if (onChange) {
      onChange(event.target.value);
    }
  }
</script>

<div class="wrapper" style={styleVars}>
  <label class="radio-label">
    <input type="radio" {id} {name} {value} {checked} on:change={handleChange} />
    <span class="custom-radio"></span>
  </label>
</div>

<style>
  .wrapper {
    display: inline-block;
  }

  .radio-label {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--hit-size, 45px);
    height: var(--hit-size, 45px);
    cursor: pointer;
  }

  input[type="radio"] {
    position: absolute;
    opacity: 0;
  }

  .custom-radio {
    position: relative;
    width: var(--circle-size, 32px);
    height: var(--circle-size, 32px);
    background: var(--menu-bg);
    border: 1.5px solid var(--border);
    border-radius: 50%;
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }

  .custom-radio::after {
    content: "";
    position: absolute;
    width: var(--dot-size, 10px);
    height: var(--dot-size, 10px);
    background: var(--accent);
    border-radius: 50%;
    opacity: 0;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: opacity 0.2s ease;
  }

  input[type="radio"]:checked + .custom-radio {
    background: color-mix(in srgb, var(--accent) 5%, var(--menu-bg));
    border-color: var(--accent);
  }

  input[type="radio"]:checked + .custom-radio::after {
    opacity: 1;
  }

  .radio-label:hover .custom-radio {
    background: color-mix(in srgb, var(--accent) 5%, var(--menu-bg));
  }
</style>