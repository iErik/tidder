import { fileURLToPath } from 'node:url'

import {
  defineConfig,
  mergeConfig
} from 'vitest/config'

import viteConfig from './vite.config.mts'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

// One run, two projects. The renderer merges the Vite config
// (aliases, Sass, React); the main process and scripts/ run
// in plain Node. Both take their paths from the repo root,
// not app/
export default defineConfig({
  test: {
    // One report for both projects. There's no threshold
    coverage: {
      provider: 'v8',
      include: ['app/**/*.{ts,tsx}', 'electron/**/*.js'],
      exclude: ['**/*.test.*', '**/test/**', '**/*.d.ts']
    },

    projects: [
      mergeConfig(viteConfig, {
        test: {
          name: 'renderer',
          root: rootDir,
          environment: 'happy-dom',
          include: ['app/**/*.test.{ts,tsx}'],
          setupFiles: ['app/test/setup.ts'],
          unstubGlobals: true,
          // Compiles SCSS modules, so a test sees the classes a
          // module really defines. Other styles stay skipped
          css: { include: [/\.module\.scss$/] }
        }
      }),
      {
        test: {
          name: 'main',
          root: rootDir,
          environment: 'node',
          include: [
            'electron/**/*.test.js',
            'scripts/**/*.test.mjs'
          ],
          setupFiles: ['electron/test/setup.js']
        }
      }
    ]
  }
})
