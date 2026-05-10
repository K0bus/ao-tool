export default defineNuxtConfig({
  devtools: { enabled: true },

  components: {
    dirs: [
      {
        path: '~/components',
        pathPrefix: false,
      },
    ],
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt',
  ],

  /** Cache client durable des icônes Albion (CDN) via Workbox — affichage quasi instantané au retour */
  pwa: {
    registerType: 'autoUpdate',
    strategies: 'generateSW',
    manifest: {
      name: 'Albion Codex',
      short_name: 'Codex',
      description: 'Base Albion Online — items, crafting, marché',
      theme_color: '#0a0a0f',
      background_color: '#0a0a0f',
      display: 'standalone',
      start_url: '/',
      lang: 'fr',
    },
    client: {
      registerPlugin: true,
      /** Pas de prompt « Ajouter à l’écran d’accueil » — focus sur le cache CDN */
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
    },
    workbox: {
      navigateFallbackDenylist: [/^\/api\//],
      runtimeCaching: [
        {
          urlPattern:
            /^https:\/\/render\.albiononline\.com\/v1\/(item|spell)\/.+\.png(\?.*)?$/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'ao-render-icons-v1',
            expiration: {
              maxEntries: 1000,
              maxAgeSeconds: 60 * 60 * 24 * 30,
              purgeOnQuotaError: true,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
  },

  runtimeConfig: {
    sessionSecret: process.env.NUXT_SESSION_SECRET ?? '',
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    public: {
      appName: 'Albion Tool',
      appUrl: process.env.APP_URL ?? 'http://localhost:3000',
    },
  },

  css: ['~/assets/css/design-system.css'],

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: '~/tailwind.config.ts',
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  sourcemap: {
    server: false,
    client: false,
  },

  nitro: {
    experimental: {
      tasks: true,
    },
  },

  app: {
    head: {
      title: 'Albion Tool',
      htmlAttrs: { lang: 'en', class: 'dark' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0a0a0f' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'preconnect', href: 'https://render.albiononline.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap' },
      ],
    },
  },

  compatibilityDate: '2024-12-01',
})
