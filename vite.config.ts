import { defineConfig } from 'vite';

export default defineConfig({
  // The settings API (worker/index.ts) runs under `bun run dev:api` (wrangler dev, port 8787).
  // Without it the app still works; changes then only save in the browser.
  server: { proxy: { '/api': 'http://localhost:8787' } },
  // three.js alone is ~600 kB minified; one chunk is fine.
  build: { chunkSizeWarningLimit: 1000 },
});
