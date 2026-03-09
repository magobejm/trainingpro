import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  envPrefix: ['VITE_', 'EXPO_PUBLIC_'],
  optimizeDeps: {
    include: ['react-native-web'],
  },
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@trainerpro/ui',
        replacement: resolve(__dirname, '../../packages/ui/src/index.ts'),
      },
      {
        find: /^react-native$/,
        replacement: resolve(__dirname, './node_modules/react-native-web/dist/index.js'),
      },
    ],
  },
});
