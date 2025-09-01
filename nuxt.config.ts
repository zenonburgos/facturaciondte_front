// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      adminUrl: process.env.NUXT_PUBLIC_ADMIN_URL,
      // Aquí también debería estar la URL de tu API
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    }
  },
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    'vuetify-nuxt-module',
    '@pinia/nuxt'
  ],
  vuetify: {
    moduleOptions: {
      /* Opciones del módulo de Vuetify */
    },
    vuetifyOptions: {
      /* Opciones de Vuetify */
    }
  }
})
