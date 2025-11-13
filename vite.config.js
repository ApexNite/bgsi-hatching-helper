import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { randomBytes } from 'crypto'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __BUILD_HASH__: JSON.stringify(randomBytes(8).toString('hex')),
  },
})
