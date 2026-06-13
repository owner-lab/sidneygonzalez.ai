import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['pyodide'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor'
          }
          if (id.includes('node_modules/motion') || id.includes('node_modules/lenis')) {
            return 'animation'
          }
          // Note: recharts/@nivo are intentionally NOT given named chunks. A named
          // 'charts-nivo' chunk caused rolldown to allocate react-dom's code into it,
          // so the eager 'vendor' shim statically imported charts-nivo (~146 KB gzip)
          // into the modulepreload graph even though @nivo is only reached through
          // React.lazy projects. Letting them code-split naturally with their lazy
          // projects keeps the chart libs out of the initial payload.
        },
      },
    },
    target: 'esnext',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
  },
})
