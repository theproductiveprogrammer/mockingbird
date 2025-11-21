import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/PluginComponent.tsx'),
      name: 'PluginComponent',
      fileName: 'component',
      formats: ['es'],
    },
    rollupOptions: {
      // Externalize React to use the version from the main app
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
