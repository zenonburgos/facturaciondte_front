<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const { $api } = useNuxtApp();

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
</script>