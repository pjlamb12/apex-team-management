/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import * as path from 'path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/frontend',
  plugins: [
    angular({
      tsconfig: path.resolve(__dirname, 'tsconfig.spec.json'),
    }),
    nxViteTsPaths(),
  ],
  test: {
    name: 'frontend',
    watch: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, 'src/test-setup.ts')],
    reporters: ['default'],
    server: {
      deps: {
        inline: [/@ionic\/core/, /@ionic\/angular/, /ionicons/]
      }
    },
  },
}));
