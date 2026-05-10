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
  ],

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
