/// <reference types="node" />
import { defineConfig } from 'vite'
import { geaPlugin } from '@geajs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/** Public path for assets (GitHub Project Pages: `/repo-name/`; local dev: `/`). */
function appBase(): string {
  const raw = process.env.VITE_BASE_PATH?.trim()
  if (!raw || raw === '/') return '/'
  const withSlash = raw.endsWith('/') ? raw : `${raw}/`
  return withSlash.startsWith('/') ? withSlash : `/${withSlash}`
}

export default defineConfig(() => {
  const base = appBase()
  const navigateFallback = base === '/' ? '/index.html' : `${base}index.html`

  return {
    base,
    plugins: [
      tailwindcss(),
      geaPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null,
        includeAssets: ['pwa-192.png', 'pwa-512.png'],
        manifest: {
          name: 'Torque Log Studio',
          short_name: 'Torque Log',
          description: 'Visualize Torque OBD2 CSV logs in your browser.',
          theme_color: '#010102',
          background_color: '#010102',
          display: 'standalone',
          orientation: 'any',
          start_url: base,
          scope: base,
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          navigateFallback,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    build: {
      modulePreload: { polyfill: false },
    },
  }
})
