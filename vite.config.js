import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function suppressTailwindFullReload() {
  return {
    name: 'suppress-tailwind-full-reload',
    configureServer(server) {
      const wrap = (hot) => {
        if (!hot || typeof hot.send !== 'function') return
        const orig = hot.send.bind(hot)
        hot.send = (payload) => {
          if (payload && payload.type === 'full-reload' && payload.path === undefined) {
            return
          }
          return orig(payload)
        }
      }
      wrap(server.hot)
      if (server.ws) wrap(server.ws)
      if (server.environments) {
        for (const env of Object.values(server.environments)) wrap(env && env.hot)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    suppressTailwindFullReload(),
  ],
  server: {
    watch: {
      ignored: ['**/server/**', '**/dist/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
