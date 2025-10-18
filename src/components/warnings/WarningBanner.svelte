<script>
    export let type = 'warning';
    export let title = '';
    export let items = [];
    export let recommendation = '';
    export let dismissible = true;
    export let expanded = false;
    export let onDismiss = () => {};

    let isExpanded = expanded;
    $: icon = type === 'error' ? '❌' : type === 'info' ? 'ℹ️' : '⚠️';

    function expand() {
        isExpanded = !isExpanded;
    }
</script>

<div class="banner {type}">
    <span class="icon">{icon}</span>

    <div class="content">
        <p class="title">{title}</p>

        {#if isExpanded && items.length > 0}
            <div class="details">
                {#each items as item}
                    <div class="item">
                        <strong>{item.label}:</strong> {item.description}
                    </div>
                {/each}
                {#if recommendation}
                    <div class="recommendation">{recommendation}</div>
                {/if}
            </div>
        {/if}
    </div>

    {#if items.length > 0}
        <button class="icon-btn expand" type="button" on:click={expand}>
            <span class:expanded={isExpanded}>▼</span>
        </button>
    {/if}

    {#if dismissible}
        <button class="icon-btn dismiss" type="button" on:click={onDismiss}>✕</button>
    {/if}
</div>

<style>
    .banner {
        background: var(--banner-bg);
        border: 1px solid var(--banner-border);
        border-radius: var(--radius-md);
        padding: 1rem;
        margin-top: 1rem;
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
    }

    .banner.warning {
        --banner-bg: rgba(255, 255, 0, 0.1);
        --banner-border: rgba(255, 255, 0, 0.3);
        --accent: rgba(255, 255, 0, 0.4);
    }

    .banner.info {
        --banner-bg: rgba(59, 130, 246, 0.1);
        --banner-border: rgba(59, 130, 246, 0.3);
        --accent: rgba(59, 130, 246, 0.4);
    }

    .banner.error {
        --banner-bg: rgba(239, 68, 68, 0.1);
        --banner-border: rgba(239, 68, 68, 0.3);
        --accent: rgba(239, 68, 68, 0.4);
    }

    .icon {
        font-size: 1.5rem;
        line-height: 1;
        margin-top: 0.1rem;
        flex-shrink: 0;
    }

    .content {
        flex: 1;
    }

    .title {
        margin: 0.3rem 0 0 0.3rem;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--primary-text);
    }

    .icon-btn {
        background: color-mix(in srgb, var(--accent) 20%, transparent);
        border: none;
        color: var(--primary-text);
        cursor: pointer;
        width: 28px;
        height: 28px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s ease, transform 0.1s ease;
        flex-shrink: 0;
    }

    .icon-btn:hover {
        background: color-mix(in srgb, var(--accent) 30%, transparent);
    }

    .icon-btn:active {
        transform: scale(0.97);
        background: color-mix(in srgb, var(--accent) 40%, transparent);
    }

    .expand span {
        font-size: 0.75rem;
        transition: transform 0.2s ease;
    }

    .expand span.expanded {
        transform: rotate(180deg);
    }

    .details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 0.75rem;
    }

    .item {
        font-size: 0.85rem;
        color: var(--secondary-text);
        line-height: 1.4;
        padding-left: 0.5rem;
        border-left: 2px solid var(--accent);
    }

    .item strong {
        color: var(--primary-text);
        font-weight: 600;
    }

    .recommendation {
        font-size: 0.85rem;
        color: var(--primary-text);
        background: color-mix(in srgb, var(--accent) 30%, transparent);
        padding: 0.5rem;
        border-radius: var(--radius-sm);
        border-left: 3px solid var(--accent);
        margin-top: 0.25rem;
    }
</style>