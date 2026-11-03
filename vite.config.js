import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: './src/main.js',
      output: {
        entryFileNames: 'mmg.js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] ?? assetInfo.name ?? '';
          if (name.endsWith('.css')) return 'mmg.css';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  server: {
    open: '/dev/host-page.html',
    proxy: {
      '/api/upload': {
        target: 'http://127.0.0.1:3099',
        changeOrigin: true,
      },
    },
  },
});
