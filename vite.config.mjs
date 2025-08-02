import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    outDir: 'dist',
  },
  // server: {
  //   proxy: {
  //     // Proxy /api/v1/* → http://localhost:4000/api/v1/*
  //     '/api/v1': {
  //       target: 'http://localhost:4000',
  //       changeOrigin: true
  //     },

  //     // Proxy /api/search → http://localhost:4000/api/search
  //     '/api/search': {
  //       target: 'http://localhost:4000',
  //       changeOrigin: true
  //     },

  //     // Proxy /static/* → http://localhost:4000/static/*
  //     '/static': {
  //       target: 'http://localhost:4000',
  //       changeOrigin: true
  //     }
  //   }
  // },
  rollupOptions: {
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false
    }
  },
});
