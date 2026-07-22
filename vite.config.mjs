import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';

import { timestampPlugin } from './vite/viteTimestampPlugin.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [vue(), ...(mode === 'production' ? [timestampPlugin(env)] : [])],
    server: { host: '127.0.0.1', port: 3003, open: false },
    build: {
      rollupOptions: {
        plugins: [visualizer({ open: false, filename: 'bundle-stats.html' })],
      },
    },
  };
});
