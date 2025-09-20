import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default defineNuxtPlugin(nuxtApp => {
  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      themes: {
        light: {
          dark: false,
          colors: {
            // Definimos los colores usando variables CSS que controlaremos
            primary: 'rgb(var(--v-theme-primary))',
            secondary: 'rgb(var(--v-theme-secondary))',
          }
        }
      }
    }
  })
  nuxtApp.vueApp.use(vuetify)
})