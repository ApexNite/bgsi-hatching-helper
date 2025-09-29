<script>
    export let id = "";
    export let value = 0;
    export let onInput = null;

    let displayValue = String(value);

    $: if (value !== Number(displayValue)) {
        displayValue = String(value);
    }

    function handleInput(event) {
        const newValue = event.target.value;
        
        if (/^\d*$/.test(newValue)) {
            displayValue = newValue;
            let val = Number(displayValue) || 0;
            
            if (onInput) {
                onInput({ value: val, id })
            }
        } else {
            event.target.value = displayValue;
        }
    }
</script>

<div class="wrapper">
    <input
        type="text"
        class="number-input"
        bind:value={displayValue}
        on:input={handleInput}
        autocomplete="off"
        maxlength="10"
        inputmode="numeric"
        pattern="\d*"
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