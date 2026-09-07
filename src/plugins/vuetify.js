import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'

// Piloto de migración: por ahora solo lo usa CatalogView.vue ("Mi catálogo"). El tema usa
// el mismo color de marca que el resto de la app (--color-brand-600 en style.css) para que
// no desentone tanto mientras conviven los dos sistemas de diseño.
export default createVuetify({
  icons: {
    defaultSet: 'mdi',
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#5a32f4',
          secondary: '#0f172a',
          error: '#e11d48',
          warning: '#d97706',
          success: '#059669',
          surface: '#ffffff',
          background: '#f8fafc',
        },
      },
    },
  },
  defaults: {
    VBtn: { rounded: 'lg' },
    VCard: { rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'comfortable', rounded: 'lg' },
    VSelect: { variant: 'outlined', density: 'comfortable', rounded: 'lg' },
  },
})
