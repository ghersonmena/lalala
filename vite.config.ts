/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // Nombre e ícono configurables desde .env / .env.local (ver .env.example)
  const appName = env.VITE_APP_NAME || 'LaLaLa'
  const appShortName = env.VITE_APP_SHORT_NAME || appName
  const appIcon = env.VITE_APP_ICON || 'public/icon.svg'

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        // Genera favicon, apple-touch-icon y los PNG del manifest a partir de VITE_APP_ICON
        pwaAssets: {
          image: appIcon,
          preset: 'minimal-2023',
          injectThemeColor: false,
          overrideManifestIcons: true,
        },
        manifest: {
          name: appName,
          short_name: appShortName,
          description: `${appName} — tu música de Jellyfin`,
          lang: 'es',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          theme_color: '#0E0E10',
          background_color: '#0E0E10',
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
          // Solo precachea fuentes latinas; los demás alfabetos se descargan si hacen falta.
          globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2'],
          navigateFallback: '/index.html',
        },
      }),
    ],
    // Escucha en todas las interfaces para poder abrir la app desde el celular en la misma red
    // (http://<IP-de-tu-equipo>:5173). Solo afecta a `npm run dev` / `npm run preview`.
    // allowedHosts: permite abrirla por un túnel rápido de Cloudflare (cloudflared tunnel --url …).
    server: { host: true, allowedHosts: ['.trycloudflare.com'] },
    preview: { host: true, allowedHosts: ['.trycloudflare.com'] },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    test: {
      environment: 'jsdom',
      globals: false,
      include: ['src/**/*.test.{ts,tsx}'],
    },
  }
})
