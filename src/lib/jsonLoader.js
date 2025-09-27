import { writable } from 'svelte/store';

export function jsonStore(path) {
    const store = writable(null);
    
    async function load() {
        try {
            const res = await fetch(path);
            const data = await res.json();
            store.set(data);
        } catch (err) {
            console.error(`Failed to load ${path}:`, err);
        }
    }
    
    load();
    
    return {
        subscribe: store.subscribe
    };
}
