import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    outDir: 'dist',
  },
  rollupOptions: {
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false
    }
  },
});
