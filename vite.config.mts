import { fileURLToPath } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const appDir = fileURLToPath(new URL('./app', import.meta.url))

// Bare import aliases rooted at app/, mirrored in tsconfig.json `paths`.
const aliasRoots = [
  'api', 'components', 'config', 'core', 'hooks', 'layouts', 'pages', 'utils'
]

// The CSP in index.html only allows the app's own scripts. The dev server
// injects an inline script for React Fast Refresh, so it's allowed in dev
// only; production builds keep the strict policy.
const devInlineScripts: Plugin = {
  name: 'tidder-dev-csp',
  apply: 'serve',
  transformIndexHtml: (html) =>
    html.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'")
}

export default defineConfig({
  root: appDir,
  base: './',
  plugins: [react(), devInlineScripts],

  resolve: {
    alias: aliasRoots.map((root) => ({
      find: new RegExp(`^${root}/`),
      replacement: `${appDir}/${root}/`
    }))
  },

  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [appDir],
        silenceDeprecations:
          [
            'import',
            'global-builtin',
            'color-functions',
            'slash-div',
            'if-function'
          ]
      }
    }
  },

  server: { port: 4200, strictPort: true },

  build: {
    // electron/main.js loads dist/renderer/browser/index.html.
    outDir: fileURLToPath(new URL('./dist/renderer/browser', import.meta.url)),
    emptyOutDir: true
  }
})
