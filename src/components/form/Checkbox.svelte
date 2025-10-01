<script>
    export let id = "";
    export let checked = false;
    export let onChange = null;

    function handleChange(event) {
        if (onChange) {
            onChange(event.target.checked);
        }
    }
</script>

<div class="wrapper">
    <label class="checkbox-label">
        <input
            type="checkbox"
            {id}
            bind:checked
            on:change={handleChange}
        />
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
        width: 45px;
        height: 45px;
        cursor: pointer;
    }
    
    input[type="checkbox"] {
        position: absolute;
        opacity: 0;
    }
    
    .custom-checkbox {
        position: relative;
        width: 32px;
        height: 32px;
        background: var(--menu-bg);
        border: 1.5px solid var(--border);
        border-radius: var(--radius-md);
        transition: background-color 0.2s ease;
    }
    
    .custom-checkbox::after {
        content: '';
        position: absolute;
        width: 12px;
        height: 18px;
        border: solid var(--accent);
        border-width: 0 2px 2px 0;
        transform: rotate(45deg) translate(-2px, -2px);
        opacity: 0;
        transition: opacity 0.2s ease;
        top: 50%;
        left: 50%;
        margin: -9px 0 0 -6px;
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