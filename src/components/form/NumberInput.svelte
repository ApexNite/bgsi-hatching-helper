<script>
    export let id = "";
    export let value = 0;
    export let onInput = null;

    function handleInput(event) {
        let val = Number(event.target.value);

        if (onInput) {
            onInput({ value: val, id })
        };
    }
</script>

<div class="wrapper">
    <input
        type="number"
        class="number-input"
        bind:value
        on:input={handleInput}
        autocomplete="off"
    />
</div>

<style>
.wrapper {
    display: inline-block;
    position: relative;
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

.number-input::-webkit-outer-spin-button,
.number-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
</style>