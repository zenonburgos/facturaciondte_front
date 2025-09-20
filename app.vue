<template>
  <v-app>
    <v-main>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </v-main>
  </v-app>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const { $api } = useNuxtApp();
const settings = usePlatformSettings();

// onMounted se ejecuta una sola vez cuando la aplicación se carga en el cliente.
onMounted(async () => {
  // Si el store dice que estamos autenticados (porque encontró un token en la cookie)
  // PERO no tenemos los datos del objeto 'user'...
  if (authStore.isAuthenticated && !authStore.user) {
    try {
      // ...hacemos una llamada al endpoint /api/user para obtenerlos.
      const user = await $api('/api/user');
      // Guardamos los datos recibidos en el store.
      authStore.setUser(user);
    } catch (error) {
      // Si la llamada falla (ej. token inválido), cerramos la sesión.
      console.error("No se pudo rehidratar el usuario, cerrando sesión.", error);
      authStore.logout();
    }
  }
});

const hexToRgb = (hex) => {
  if (!hex) return '30, 136, 229'; // Color primario por defecto (azul)
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '30, 136, 229'; // Fallback
};

const cssVars = computed(() => {
  if (!settings.value) return '';
  const primaryRgb = hexToRgb(settings.value.color_primary);
  const secondaryRgb = hexToRgb(settings.value.color_secondary);
  return `
    :root {
      --v-theme-primary: ${primaryRgb};
      --v-theme-secondary: ${secondaryRgb};
    }
  `;
});

useHead({
  style: [{
    children: cssVars,
    type: 'text/css'
  }]
});
</script>