import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

const host = process.env.TAURI_DEV_HOST;
const path = p => resolve(process.cwd(), p)

export default defineConfig(async () => ({
  plugins: [react(), svgr()],

  // Vite options tailored for Tauri development and
  // only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,

  resolve: {
    alias: {
      '@': path('./src'),
      '@lib': path('./src/lib'),
      '@utils': path('./src/utils'),
      '@styles': path('./src/styles'),
      '@components': path('./src/components'),
      '@layouts': path('./src/layouts'),
      '@assets': path('./src/assets'),
      '@icons': path('./src/assets/icons'),
      '@themes': path('./src/themes'),
      '@services': path('./src/services')
    }
  },

  // 2. tauri expects a fixed port, fail if that port
  // is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
