<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { usePlatformSettings } from '~/composables/usePlatformSettings';
import { useNuxtApp, useRuntimeConfig } from '#app';

const authStore = useAuthStore();
const { $api, $vuetify } = useNuxtApp();
const settings = usePlatformSettings();

// Lógica SEO Manual
const url = useRequestURL()

useHead({
  htmlAttrs: {
    lang: 'es-SV'
  },
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} | Smart DTE` : 'Smart DTE - Facturación Electrónica El Salvador';
  },
  link: [
    { 
      rel: 'canonical', 
      href: url.href // Esto pone automáticamente la URL actual como canónica
    },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
  ],
  meta: [
    { name: 'robots', content: 'index, follow' } // Forzamos indexación explícita
  ]
})

// 1. Obtenemos la configuración del runtime
const config = useRuntimeConfig();
// 2. Construimos la URL completa y correcta para la API
const apiUrl = `${config.public.apiBaseUrl}/api/platform-settings`;

// 3. Usamos la URL correcta en el useFetch
const { data, error } = await useFetch(apiUrl, { 
  server: false,
  lazy: true,
});

onMounted(async () => {
  if (authStore.isAuthenticated && !authStore.user) {
    try {
      const user = await $api('/api/user');
      authStore.setUser(user);
    } catch (error) {
      console.error("No se pudo rehidratar el usuario, cerrando sesión.", error);
      authStore.logout();
    }
  }
});

watch(data, (newSettings) => {
  if (newSettings && $vuetify.theme.global.current.colors) {
    settings.value = newSettings;

    if (newSettings.color_primary) {
      $vuetify.theme.global.current.colors.primary = newSettings.color_primary;
    }
    if (newSettings.color_secondary) {
      $vuetify.theme.global.current.colors.secondary = newSettings.color_secondary;
    }
  }
}, { immediate: true });

watch(error, (newError) => {
  if (newError) {
    console.error('Error al cargar la configuración de la plataforma:', newError);
  }
});
</script>