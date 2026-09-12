import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Wait for editor/formatter writes to finish before transforming modules.
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
    },
  },
});
