import { defineConfig } from 'vite';

export default defineConfig({
  // three.js alone is ~600 kB minified; one chunk is fine for a local tool.
  build: { chunkSizeWarningLimit: 1000 },
});
