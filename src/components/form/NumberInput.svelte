<script>
    export let id = "";
    export let value = 0;
    export let onInput = null;

    function sanitize(str) {
        let s = String(str ?? "");
        s = s.replace(/\D/g, "");
        s = s.slice(0, 10);
        return s;
    }

    let text = "";

    $: {
        const numericText = Number(text);

        if (!Number.isFinite(numericText) || numericText !== value) {
            text = sanitize(value);
        }
    }

    function handleInput(event) {
        const raw = event.target.value;
        const next = sanitize(raw);

        text = next;

        let numeric = 0;
        if (next !== "") {
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
        inputmode="numeric"
        pattern="[0-9]*"
        maxlength={10}
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