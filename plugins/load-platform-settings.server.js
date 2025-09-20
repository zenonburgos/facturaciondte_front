import { usePlatformSettings } from '~/composables/usePlatformSettings'

export default defineNuxtPlugin(async (nuxtApp) => {
  const settings = usePlatformSettings()
  const { $api } = useNuxtApp()

  // Si los datos no han sido cargados, los buscamos.
  if (!settings.value) {
    try {
      // Usamos tu composable $api para hacer la llamada
      const data = await $api('/api/platform-settings')
      settings.value = data
    } catch (error) {
      console.error('Error fetching platform settings:', error)
      // Podemos establecer valores por defecto si la API falla
      settings.value = { platform_name: 'Smart DTE' }
    }
  }
})