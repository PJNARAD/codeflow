import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: [],
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    port: 5173,
    open: true,
    cors: true
  },
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@adapters': resolve(__dirname, 'src/adapters'),
      '@execution': resolve(__dirname, 'src/execution'),
      '@viz': resolve(__dirname, 'src/viz'),
      '@ai': resolve(__dirname, 'src/ai'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@features': resolve(__dirname, 'src/features')
    }
  },
  optimizeDeps: {
    include: ['vm2', 'quickjs', 'pyodide', 'typescript'],
    exclude: []
  },
  worker: {
    format: 'es',
    plugins: []
  },
  esbuild: {
    target: 'es2022',
    supported: {
      'bigint': true,
      'dynamic-import': true,
      'top-level-await': true
    }
  },
  assetsInclude: ['**/*.wasm'],
  plugins: [
    {
      name: 'wasm-loader',
      enforce: 'pre',
      async load(id) {
        if (id.endsWith('.wasm')) {
          const fs = await import('fs/promises');
          const buffer = await fs.readFile(id);
          const base64 = buffer.toString('base64');
          return `export default 'data:application/wasm;base64,${base64}';`;
        }
      }
    }
  ]
});