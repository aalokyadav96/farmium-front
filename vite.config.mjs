// vite.config.js
import { defineConfig } from 'vite';

// let API_URL = 'https://zincate.onrender.com';
let API_URL = 'http://localhost:7000';
let AGI_URL = 'http://localhost:7000';
let SRC_URL = 'http://localhost:7000';
let SEARCH_URL = 'http://localhost:7000';

export default defineConfig({
  root: '.',  // the root directory of your project
  build: {
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    outDir: 'dist',  // output directory for built files
  },
  server: {
    proxy: {
      '/api': API_URL, // Proxy API requests to Go server
      '/agi': AGI_URL, // Proxy API requests to Go server
      '/static': SRC_URL, // Proxy API requests to Go server
      '/api/search': SEARCH_URL, // Proxy API requests to Go server
    },
  },
});
